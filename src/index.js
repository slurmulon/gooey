'use strict';

const jsonPath = require('jsonpath'),
      _ = require('lodash')

var _services = new Set()
var _queue    = []

const _config = {
  data: {
    matching: {
      queries : true
    },
    broadcast: {
      ignore: {
        falsy: true
      }
    }
  }
}

const directions = ['up', 'down']

// a canonical, heiarchical source of data that can delegate updates bi-directionally
export class Service {

  constructor(name: String, factory?: Function, parent?: Service, children?: Array = [], config?: Object = _config) {
    if (name === undefined || isRegistered(name)) {
      throw `Services must have unique names: ${name}`
    }

    this.name          = name
    this.factory       = factory
    this.parent        = parent ? parent.relateTo(this) : null
    this.children      = this.relateToAll(children)
    this.data          = {}
    this.subscriptions = []
    this.config        = config
    this.isRoot        = !this.parent

    _services.add({name, service: this})
  }

  // TODO - clone data so that it is immutable
  broadcast(data, success: Function = _.noop, error: Function = _.noop, direction: String = 'down'): Promise {
    // subscribers who match the current broadcast
    const matches = this.subscriptions.filter(scrip => { return !!this.matches(data, scrip).size })

    // current service node. proxy data if this service's data update matches any subscriptions
    const result  = matches.length ? matches.map(scrip => { return scrip.on(data) }) : data

    // direction: down
    // "parallel" breadth, synchronized depth
    if (this.children.length) {
      return Promise
        .all(this.children.map(child => {
          return child.broadcast(result, success, error, direction)
        }))
    }

    // leaf node
    return new Promise((resolve, reject) => {
      resolve(success(result))
    })
  }

  // creates and registers a broadcast subscription against a jsonpath pattern
  subscribe(path: String = '$', on: Function): Subscription {
    const scrip = new Subscription(this.name, path, on)

    this.subscriptions.push(scrip)

    return scrip
  }

  // ends a broadcast subscription
  unsubscribe(scrip: Subscription) {
    this.subscriptions.splice(this.subscriptions.indexOf(scrip), 1)
  }

  // updates the Service's canonical data source with new data and broadcasts the change
  update(data, success?: Function, error?: Function): Promise {
    this.data = data

    return this.broadcast(data, success, error)
  }

  // determines if a subscription path matches data
  matches(data, scrip: Subscription): Set {
    const matchSet = new Set()

    if (this.config.data.matching.queries) {
      const jpMatches = jsonPath.query(data, scrip.path)

      if (jpMatches && !!jpMatches.length) {
        matchSet.add({path: scrip.path, matches: jpMatches})
      }
    }

    if (data === scrip.pattern && !matchSet.contains(data)) {
      matchSet.add({path: scrip.path, matches: [data]})
    }

    return matchSet
  }

  //  TODO - validate for cyclic dependencies
  // establishes Service as a parent to the provided child Service
  relateTo(child: Service): Service {
    this.children.push(child)

    return this
  }

  // establishes Service as a parent to each provided child Service
  relateToAll(children: Array): Array {
    return children.map(c => { c.parent = this; return c })
  }

}

export function service({name, factory, parent, children, config}): Service {
  return new Service(name, factory, parent, children, config)
}

export function services(): Set {
  return _services
}

export function isRegistered(name): Boolean {
  return _.contains(Array.from(_services).map((s) => {return s.name}), name)
}

export class Subscription {

  // TODO - make "then" some combination of a Promise and a proxy handler
  // https://github.com/lukehoban/es6features#proxies
  constructor(service: Service, path: String, on: Function) {
    this.service = service
    this.path    = path
    this.on      = on
  }

  end() {
    service.unsubscribe(this)
  }

}

// subscribe to all services and react to any data changes within them matching the provided hash
// export function subscribe(hash: String, callback: Function)

// broadcast a data change across all services (searches for roots, leafs, and orphans)
// export function broadcast(path: String, data)

// export function component({name: String, factory: Function, apiUrl: String, templateUrl: String}) {
//   // create a RestService with a child ModelService with a child DomService
// }

export function clear() {
  _services = new Set()
}

// Modules

export class Module { }
