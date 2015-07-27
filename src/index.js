'use strict';

var jsonPath = require('jsonpath'),
           _ = require('lodash')

var _services = new Set()

var _config = {
  data: {
    matching: {
      queries : true
    }  
  },

  errors: {

  }
}

var directions = ['up', 'down']

// a canonical, heiarchical source of data that can delegate updates to child sources
export class Service {

  constructor(name: String, factory?: Function, parent?: Service, children?: Array=[], config?: Object=_config) {
    this.name          = name
    this.factory       = factory
    this.parent        = parent ? parent.relateTo(this) : null
    this.children      = this.relateToAll(children)
    this.config        = config
    this.scope         = {}
    this.subscriptions = []
    this.isRoot        = !this.parent

    if (!name) {
      throw 'Error: services require names'
    }

    if (!_.find(_services.map_.entries_, {name})) {
      _services.add(this)
    } else {
      throw 'Error: service "${name}" has already been registered!'
    }

    if (factory){
      factory({scope: this.scope})
    }
  }

// TODO - integrate http://www.nczonline.net/blog/2014/04/22/creating-defensive-objects-with-es6-proxies/
  broadcast(data, success: Function, error: Function, direction: String='down'): Promise {
    const matches = this.subscriptions.filter(scrip => { return this.matches(data, scrip).size > 0 })

    // current service node. proxy data if this service's data update matches any subscriptions
    // FIXME - ensure that no two identical subscriptions (pattern + data) are executed concurrently. they must be syncronized
    const result = matches.length ? matches.map(scrip => { return scrip.onMatch(data) }) : data

    // direction: down
    // "parallel" breadth, synchronized depth
    if (this.children.length) {
      return Promise.all(this.children.map(child => {
        return child.broadcast(result, success, error, direction)
      }))
    }

    // reached leaf node
    // TODO - reject with error() as needed.
    return new Promise((resolve, reject) => { resolve({name: this.name, result}) })
  }

  subscribe(pattern: String, then?: Function) {
    let scrip = new Subscription(pattern, then)

    this.subscriptions.push(scrip)

    return scrip
  }

  update(data, success?: Function, error?: Function) {
    this.scope = data

    broadcast(data, success, error)
  }

  // TODO - turn into generator
  matches(data, scrip: Subscription) {
    let matchSet = new Set()

    if (this.config.data.matching.queries) {
      this.subscriptions.forEach(function(scrip) {
        // TODO - determine between names and jsonpath queries
        let jpMatches = jsonPath.query(data, scrip.pattern)

        if (jpMatches && jpMatches.length > 0) {
          matchSet.add({pattern: scrip.pattern, matches: jpMatches})
        }
      })
    }

    if (data === scrip.pattern) {
      matchSet.add({pattern: scrip.pattern, data})
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

// Modules

export class Module { }
