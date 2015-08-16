'use strict';

var jsonPath = require('jsonpath'),
    _ = require('lodash')

var _services = new Set()

var _queue = []

var _config = {
  data: {
    matching: {
      queries : true
    },
    broadcast: {
      ignoreFalsy: true
    }
  },

  errors: {

  }
}

var directions = ['up', 'down']

// a canonical, heiarchical source of data that can delegate updates to child sources
export class Service {

  constructor(name: String, factory?: Function, parent?: Service, children?: Array=[], config?: Object=_config) {
    if (name === undefined || isRegistered(name)) {
      throw `Services must have unique names: ${name}`
    }

    this.name          = name
    this.parent        = parent ? parent.relateTo(this) : null
    this.children      = this.relateToAll(children)
    this.config        = config
    this.scope         = {}
    this.subscriptions = []
    this.isRoot        = !this.parent

    _services.add({name, service: this})
  }

  // TODO - clone data so that it is immutable
  broadcast(data, success: Function, error: Function, direction: String='down'): Promise {
    // subscribers who match the current broadcast
    const matches = this.subscriptions.filter(scrip => { return !!this.matches(data, scrip).size })

    // current service node. proxy data if this service's data update matches any subscriptions
    const result  = matches.length ? matches.map(scrip => { return scrip.onMatch(data) }) : data

    // direction: down
    if (this.children.length) {
      // "parallel" breadth, synchronized depth
      return Promise
        .all(this.children.map(child => {
          return child.broadcast(result, success, error, direction)
        }))
    }

    // leaf node
    return new Promise((resolve, reject) => {
      resolve({
        name   : this.name, 
        result : success(result)
      }) 
    })
  }

  subscribe(pattern: String, then?: Function): Subscription {
    const scrip = new Subscription(pattern, then)

    this.subscriptions.push(scrip)

    return scrip
  }

  update(data, success?: Function, error?: Function): Promise {
    this.scope = data

    broadcast(data, success, error)
  }

  matches(data, scrip: Subscription): Set {
    let matchSet = new Set()

    if (this.config.data.matching.queries) {
      const jpMatches = jsonPath.query(data, scrip.pattern)

      if (jpMatches && !!jpMatches.length) {
        matchSet.add({pattern: scrip.pattern, matches: jpMatches})
      }
    }

    if (data === scrip.pattern && !matchSet.contains(data)) {
      matchSet.add({pattern: scrip.pattern, matches: [data]})
    }

    return matchSet
  }

  //  TODO - validate for cyclic dependencies
  relateTo(child: Service): Service {
    this.children.push(child)

    return this
  }

  relateToAll(children: Array): Array {
    return children.map(c => { c.parent = this; return c })
  }

}

export function service({name, factory, parent, children, config}) {
  return new Service(name, factory, parent, children, config)
}

export function services() {
  return _services
}

export function isRegistered(name) {
  return _.contains(Array.from(_services).map((s) => {return s.name}), name)
}

export class Subscription {

  // TODO - make "then" some combination of a Promise and a proxy handler
  // https://github.com/lukehoban/es6features#proxies
  constructor(pattern: String, onMatch: Function) {
    this.pattern = pattern
    this.onMatch = onMatch
  }

  kill() {
    // TODO - remove subscription from service
  }

}

// subscribe to all services and react to any data changes withem them matching the provided hash
// export function subscribe(hash: String, callback: Function)

// broadcast a data change across all services (searches for roots, leafs, and orphans)
// export function broadcast(pattern: String, data)

// export function component({name: String, factory: Function, apiUrl: String, templateUrl: String}) {
//   // create a RestService with a child ModelService with a child DomService
// }

export function clear() {
  _services = new Set()
}
