'use strict';

//  ▄▄ •             ▄▄▄ . ▄· ▄▌
// ▐█ ▀ ▪▪     ▪     ▀▄.▀·▐█▪██▌
// ▄█ ▀█▄ ▄█▀▄  ▄█▀▄ ▐▀▀▪▄▐█▌▐█▪
// ▐█▄▪▐█▐█▌.▐▌▐█▌.▐▌▐█▄▄▌ ▐█▀·.
// ·▀▀▀▀  ▀█▄▀▪ ▀█▄▀▪ ▀▀▀   ▀ • 

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

    publish: {
      ignore: {
        falsy: true
      }
    }
  }
}

// supported types of tree traversals
const traversals = ['depth', 'breadth']

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
    this.data          = {} // TODO - make this a Proxy object, integrating with publish
    this.subscriptions = []
    this.config        = config

    _services[name] = this

    if (this.model) {
      this.model(this.data)
    }
  }

  publish(data, success: Function = _.noop, error: Function = _.noop, traversal: String = 'breadth'): Promise {
    if (!traversals.find(t => t === traversal)) {
      throw `Failed to publish, invalid traversal: ${traversal}`
    }
    
    // subscribers who match the current publish
    const matches = this.subscriptions.filter(scrip => !!this.matches(data, scrip).size)

    // current service node. proxy data if this service's data update matches any subscriptions
    const result = matches.length ? matches.map(scrip => scrip.on(data)) : data

    // direction: down
    if (this.children.length) {
      if (traversal === 'breadth') {
        return Promise
          .all(this.children.map(child => 
            child.publish(result, success, error, traversal)
          ))
      }

      if (traversal === 'depth') {
        return this.children.map(child =>
          child.publish(result, success, error, traversal)
        )
      }
    }

    // leaf node (TODO - reject)
    return new Promise((resolve, reject) => {
      resolve(success(result))
    })
  }

  // creates and registers a publish subscription against a jsonpath pattern
  subscribe(path: String = '$', on: Function): Subscription {
    const scrip = new Subscription(this.name, path, on)

    this.subscriptions.push(scrip)

    return scrip
  }

  // ends a publish subscription
  unsubscribe(scrip: Subscription) {
    this.subscriptions.splice(this.subscriptions.indexOf(scrip), 1)
  }

  // updates the Service's canonical data source with new data and publishs the change
  update(data, success?: Function, error?: Function): Promise {
    this.data = data

    return this.publish(data, success, error)
  }

  // merges and updates the Service's canonical date source with a new data object and publishs the change
  merge(data: Object, success?: Function, error?: Function): Promise {
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
  depth(node = this): Int {
    let nodeDepth = 0

    while (node.parent) {
      node = node.parent
      nodeDepth += 1
    }

    return nodeDepth
  }

  // determines if the service is a root node in the service tree
  isRoot(): Boolean {
    return !this.parent
  }

  // determines if the service is a leaf node in the service tree
  isLeaf(): Boolean {
    return !this.children
  }

  // determines all root node Services in the tree
  static findRoots(services: Array = _services): Array {
    return _(services).values().filter(svc =>
      (svc instanceof Service) ? svc.isRoot() : false
    ).value()
  }

  // determines all leaf node Services in the tree
  static findLeafs(services: Array = _services): Array {
    return _(services).values().filter(svc =>
      (svc instanceof Service) ? svc.isLeaf() : false
    ).value()
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

export var service  = ({name, model, parent, children, config}) => new Service(name, model, parent, children, config) 
export var services = _services
export var clear    = () => { _services = new Set() }

export class Subscription {

  constructor(service: Service, path: String, on: Function) {
    this.service = service
    this.path    = path
    this.on      = on
  }

  end() {
    service.unsubscribe(this)

    Object.freeze(this)
  }

}

// subscribe to all services and react to any data changes within them matching the provided hash
// export function subscribe(hash: String, callback: Function)

// publish a data change across all services (searches for roots, leafs, and orphans)
// export function publish(path: String, data)
