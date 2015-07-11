'use strict';

var jsonPath = require('jsonpath')

var services = new Set()

var config = {
  data: {
    sync: {
      greedy  : true
    },
    matching: {
      queries : true
    }  
  },

  errors: {

  }
}

var directions = ['up', 'down', 'bi']

// TODO - create Gooey interface

// a canonical, heiarchical source of data that can delegate updates to child sources
export class Service {

  constructor(name: String, factory: Function, parent?: Service, children?: Array, config?: Object=config) {
    this.name          = name
    this.parent        = parent
    this.children      = children // TODO - ensure that child services can cross-communicate with parents
    this.config        = config
    this.scope         = {}
    this.subscriptions = []
    this.isRoot        = !this.parent

    services.push(this)

    factory({scope}) // TODO - also pass in core services for http and dom
  }

  broadcast(data, success?: Function, error?: Function, direction: String='bi'): Promise {
    // NOTE - this can certainly be an efficiency bottle-neck, perhaps offer optimization through configuration
    let matches = this.subscriptions.map(scrip => scrip.matches(data, scrip))

    // current service node. proxy data if this service's data update matches any subscriptions
    let result = matches.length ? success(data) : data

    // direction: down
    if (children.length) {
      // "parallel" breadth, synchronized depth
      return Promise.all(children.map(child => {
        return child.broadcast(result, success, error, direction)
      }))
    }

    // reached leaf node
    return new Promise((resolve, reject) => { resolve({name: this.name, result}) })
  }

  subscribe(pattern: String, then?: Function) {
    let scrip = new Subscription(pattern, success)

    this.subscriptions.add(scrip)

    return scrip
  }

  update(data, success?: Function, error?: Function) {
    this.scope = data
    broadcast('*', success, error)
  }

  matches(data, scrip: Subscription) {
    var matches = {}

    this.subscriptions.forEach(function(scrip) {
      // TODO - determine between names and jsonpath queries
      var jpMatches = jsonPath.query(data, scrip.pattern)

      if (jpMatches.length) {
        matches[scrip.pattern] = jpMatches
      }
    })

    return matches
  }

  set relate(child: Service) {
    this.children.push(child)
  }

}

export function service({name: String, factory: Function}) {
  return new Service(name, factory)
}

export class Subscription {

  // TODO - make "then" some combination of a Promise and a proxy handler
  // https://github.com/lukehoban/es6features#proxies
  constructor(pattern: String, then: Function) {
    this.pattern = pattern
    this.then    = then
  }

}

// subscribe to all services and react to any data changes withem them matching the provided hash
// export function subscribe(hash: String, callback: Function)

// export function broadcast(hash: String, data)
