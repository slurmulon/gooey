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
// TODO support implicit conversion by name (so that Services can be more easily injected into components)
export class Service {

  constructor(name: String, factory?: Function, parent?: Service, children?: Array = [], config?: Object = _config) {
  // TODO - USE constructor(name: String, parent?: Service, children?: Array = [], factory?: Function, config?: Object = _config) {
    if (name === undefined || isRegistered(name)) {
      throw `Services must have unique names: ${name}`
    }

    this.name          = name
    this.factory       = factory
    this.parent        = parent ?  parent.relateTo(this) : null
    this.children      = this.relateToAll(children)
    this.data          = {} // TODO - make this a Proxy object, integrating with broadcast
    this.subscriptions = []
    this.config        = config
    this.isRoot        = !this.parent

    _services.add({name, service: this})

    // init()
  }

  init() {
    if (this.model) {
      this.model(this.model)
    }
  }

  broadcast(data, success: Function = _.noop, error: Function = _.noop, direction: String = 'down'): Promise {
    // subscribers who match the current broadcast
    const matches = this.subscriptions.filter(scrip => { return !!this.matches(data, scrip).size })

    // current service node. proxy data if this service's data update matches any subscriptions
    const result = matches.length ? matches.map(scrip => { return scrip.on(data) }) : data

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

  // merges and updates the Service's canonical date source with a new data object and broadcasts the change
  upsert(data: Object, success?: Function, error?: Function): Promise {
    if (_.isObject(data)) {
      _.merge(this.data, data)
    }

    return update(this.data)
  }

  // // // alias for subscribe
  on(path: String = '$', on: Function): Subscription {
    return subscribe(...arguments)
  }

  // alias for update
  use(data, success?: Function, error?: Function): Promise {
    return update(...arguments)
  }

  // alias for upsert
  up(data: Object, success?: Function, error?: Function): Promise {
    return upsert(...arguments)
  }

  // determines if a subscription path matches data
  matches(data, scrip: Subscription): Set {
    const matchSet = new Set()

    if (this.config.data.matching.queries) {
      const jpMatches = jsonPath.query(data, scrip.path)

      if (jpMatches && !!jpMatches.length) {
        matchSet.add(...jpMatches)
      }
    }

    if (data === scrip.pattern && !matchSet.contains(data)) {
      matchSet.add(data)
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
    return children.map(c => {
      c.parent = this

      return c
    })
  }

  // tags data with an instance based signature of the Service
  sign(data) {
    const instHash = Math.random().toString(36).substring(7)

    return data._gooey_signature = `[gooey:Service:{$instHash}]`
  }

}

export function service({name, factory, parent, children, config}): Service {
  return new Service(name, factory, parent, children, config)
}

export function services(): Set {
  return _services
}

export function isRegistered(name): Boolean {
  return _.contains(Array.from(_services).map((s) => { return s.name }), name)
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