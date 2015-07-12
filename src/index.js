'use strict';

var jsonPath = require('jsonpath')

var _services = new Set()

var config = {
  data: {
    matching: {
      queries : true
    }  
  },

  errors: {

  }
}

var directions = ['up', 'down', 'bi']

// a canonical, heiarchical source of data that can delegate updates to child sources
export class Service {

  constructor(name: String, factory: Function, parent?: Service, children?: Set, config?: Object=config) {
    this.name          = name
    this.parent        = parent
    this.children      = children
    this.config        = config
    this.scope         = {}
    this.subscriptions = []
    this.isRoot        = !this.parent

    _services.add(this)

    factory({scope: this.scope}) // TODO - also pass in core services for http and dom
  }

  broadcast(data, success?: Function, error?: Function, direction: String='bi'): Promise {
    // NOTE - this can certainly be an efficiency bottle-neck, perhaps offer optimization through configuration
    let matches = this.subscriptions.filter(scrip => scrip.matches(data, scrip))

    // current service node. proxy data if this service's data update matches any subscriptions
    // FIXME - ensure that no two identical subscriptions (pattern + data) are executed concurrently. they must be syncronized
    let result = matches.length ? matches.map(scrip => 
      scrip
        .then(success)
        .catch(error)
    ) : data

    // direction: down
    if (children.length) {
      // "parallel" breadth, synchronized depth
      return Promise.all(children.map(child => {
        return child.broadcast(result, success, error, direction)
      }))
    }

    // reached leaf node
    // TODO - call error() as needed.
    return new Promise((resolve, reject) => { resolve({name: this.name, result}) })
  }

  subscribe(pattern: String, then?: Function) {
    let scrip = new Subscription(pattern, success)

    this.subscriptions.push(scrip)

    return scrip
  }

  update(data, success?: Function, error?: Function) {
    this.scope = data

    broadcast(data, success, error)
  }

  matches(data, scrip: Subscription) {
    let matchSet = new Set()

    if (config.data.matching.queries) {
      this.subscriptions.forEach(function(scrip) {
        // TODO - determine between names and jsonpath queries
        let jpMatches = jsonPath.query(data, scrip.pattern)

        if (jpMatches.length) {
          matchSet.push({pattern: scrip.pattern, matches: jpMatches})
        }
      })
    }

    if (data === scrip.pattern) {
      matchSet.push({pattern: scrip.pattern, data})
    }

    return matchSet
  }

  //  TODO - validate for cyclic dependencies
  set relate(child: Service) {
    child.parent = this
    this.children.push(child)
  }

}

export function service({name: String, factory: Function, parent: Service, children: Array, config: Object}) {
  return new Service(name, factory, parent, children, config)
}

export function services() {
  return _services
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

// broadcast a data change across all services (searches for roots, leafs, and orphans)
// export function broadcast(pattern: String, data)

// export function component({name: String, factory: Function, apiUrl: String, templateUrl: String}) {
//   // create a RestService with a child ModelService with a child DomService
// }

export function clear() {
  _services = new Set()
}
