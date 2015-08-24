'use strict';

const jsonPath = require('jsonpath'),
      _ = require('lodash')

var _services = {}

// default configuration
const _config = {
  strict: true,
  data: {
    lazy: false,

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

// supported types of tree traversals
const traversals = ['depth_down', 'depth_up', 'breadth_down', 'breadth_up']

// a canonical, heiarchical source of data that can delegate updates bi-directionally
export class Service {

  constructor(name: String, model?: Function, parent?: Service, children?: Array = [], config?: Object = _config) {
    if (_.isUndefined(name) || Service.isRegistered(name)) {
      throw `Services must have unique names: ${name}`
    }

    this.name          = name
    this.model         = model
    this.parent        = parent ? parent.relateTo(this) : null
    this.children      = this.relateToAll(children)
    this.data          = {} // TODO - make this a Proxy object, integrating with broadcast
    this.subscriptions = []
    this.config        = config

    _services[name] = this

    if (this.model) {
      this.model(this.data)
    }
  }

  // TODO - allow broadcasts to be interrupted by any subscriber
  broadcast(data, success: Function = _.noop, error: Function = _.noop, traversal: String = 'breadth_down'): Promise {
    if (!traversals.find(t => t === traversal)) {
      throw `Failed to broadcast, invalid traversal: ${traversal}`
    }
    
    // subscribers who match the current broadcast
    const matches = this.subscriptions.filter(scrip => { return !!this.matches(data, scrip).size })

    // current service node. proxy data if this service's data update matches any subscriptions
    const result = matches.length ? matches.map(scrip => scrip.on(data)) : data

    // breadth first, down 
    if (this.children.length) {
      return Promise
        .all(this.children.map(child => 
          child.broadcast(result, success, error, traversal)
        ))
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

    return this.update(this.data, success, error)
  }

  // alias for subscribe
  on(path: String, on: Function): Subscription {
    return this.subscribe(path, on)
  }

  // alias for update
  use(data, success?: Function, error?: Function): Promise {
    return this.update(data, success, error)
  }

  // alias for upsert
  up(data: Object, success?: Function, error?: Function): Promise {
    return upsert(data, success, error)
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
  // establishes service as a parent to the provided child service
  relateTo(child: Service): Service {
    this.children.push(child)

    return this
  }

  // establishes service as a parent to each provided child service
  relateToAll(children: Array): Array {
    return children.map(c => {
      c.parent = this

      return c
    })
  }

  // determines a service's depth in the service tree
  depth(node = this) {
    let nodeDepth = 0

    while (node.parent) {
      node = node.parent
      nodeDepth += 1
    }

    return nodeDepth
  }

  // determines if the service is a root node in the service tree
  isRoot() {
    return !this.parent
  }

  // determiens if the service is a leaf node in the service tree
  isLeaf() {
    return !this.children
  }

  // returns all root node Services in the tree
  static findRoots(services: Array = _services): Array {
    return _(services).values().filter(svc => {
      return (svc instanceof Service) ? svc.isRoot() : false
    }).value()
  }

  // returns all leaf node Services in the tree
  static findLeafs(services: Array = _services): Array {
    return _(services).values().filter(svc => {
      return (svc instanceof Service) ? svc.isLeaf() : false
    }).value()
  }

  // determines if a service name is already registered in the tree
  static isRegistered(name: String): Boolean {
    return _.contains(Array.from(_services).map(s => s.name), name)
  }

  // determines if a cyclic relationship exists anywhere in the service tree
  static cycleExists(services = _services): Boolean {
    const roots = Service.findRoots(services)
    const found = !_.isEmpty(roots) ? roots.map(r => r.name) : []

    let curNode = null
    let cyclic  = false

    _.forEach(roots, (root) => {
      curNode = root

      while (!cyclic && !_.isEmpty(curNode.children)) {
        curNode.children.forEach(child => {
          if (!_.contains(found, child.name)) {
            found.push(child.name)

            curNode = child
          } else {
            cyclic = true
          }
        })
      }
    })

    return cyclic
  }
}

export function service({name, model, parent, children, config}): Service {
  return new Service(name, model, parent, children, config)
}

export function services(): Object {
  return _services
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

export function clear() {
  _services = new Set()
}