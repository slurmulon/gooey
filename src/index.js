'use strict';

// Terminology:
// - hash: A service name or JsonPath query (e.g, 'users', or '$.user')
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
    this.name        = name
    this.parent      = parent
    this.children    = children // TODO - ensure that child services can cross-communicate with parents
    this.config      = config
    this.scope       = {}
    this.subscribers = []
    this.isRoot      = !this.parent

    services.push(this)

    factory({scope}) // TODO - also pass in core services for http and dom
  }

  broadcast(hash: String, data, success?: Function, error?: Function, direction: String='bi'): Promise {
    // FIXME - look through all this.subscribers for a match - this can certainly be an efficiency bottle-neck
    let matches = true

    // current service node, process data if this service's data update matches any subscriptions
    let result = matches ? success(data) : null

    // direction: down
    if (children.length) {
      // "parallel" breadth, synchronized depth
      return Promise.all(children.map(child => {
        return child.broadcast(hash, result, success, error, direction)
      }))
    }

    // reached leaf node
    return new Promise((resolve, reject) => { resolve({name: this.name, result}) })
  }

  subscribe(pattern: String, then?: Function) {
    let scrip = new Subscription(pattern, success)

    this.subscribers.add(scrip)

    return scrip
  }

  update(data, success?: Function, error?: Function) {
    this.scope = data
    broadcast('*', success, error)
  }

  matches(data, scrip: Subscription) {
    // TODO
  }

  set relate(child: Service) {
    this.children.push(child)
  }

}

export function service({name: String, factory: Function}) {
  return new Service(name, factory)
}

export class Subscription {

  constructor(pattern: String, then: Function) {
    this.pattern = pattern
    this.then    = then
  }

}

// subscribe to all services and react to any data changes withem them matching the provided hash
// export function subscribe(hash: String, callback: Function)

// export function broadcast(hash: String, data)
