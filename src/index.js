'use strict'

//  ▄▄ •             ▄▄▄ . ▄· ▄▌
// ▐█ ▀ ▪▪     ▪     ▀▄.▀·▐█▪██▌
// ▄█ ▀█▄ ▄█▀▄  ▄█▀▄ ▐▀▀▪▄▐█▌▐█▪
// ▐█▄▪▐█▐█▌.▐▌▐█▌.▐▌▐█▄▄▌ ▐█▀·.
// ·▀▀▀▀  ▀█▄▀▪ ▀█▄▀▪ ▀▀▀   ▀ • 

import jsonPath from 'jsonpath'
import _ from 'lodash'

/**
 * Flat map of all registered services, indexed by name
 */
var _services = {}

/**
 * Default service configuration object
 */
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

/**
 * Supported flavors of service tree traversals
 */
const traversals = ['depth', 'breadth', 'async_global', 'async_local']

/**
 * A canonical, hierarchical, and composable data source that can publish and receive updates bi-directionally with other services
 */
export class Service {

  /**
   * @param {String} name
   * @param {?Function} model
   * @param {?Service} parent
   * @param {?Array} children
   * @param {?Object} config
   */
  constructor(name: String, model?: Function, parent?: Service, children?: Array = [], config?: Object = _config) {
    if (_.isUndefined(name) || Service.isRegistered(name)) {
      throw `Services must have unique names: ${name}`
    }

    this.name = name
    this.model = model
    this.state = {}
    this.parent = parent ? parent.relateTo(this) : null
    this.children = this.relateToAll(children)
    this.subscriptions = []
    this.config = config

    _services[name] = this

    if (this.model) {
      this.model(this.state)
    }
  }

  /**
   * Traverses service tree via a conflict-free path and matches subscribers against the published data
   * 
   * @param {Object} data
   * @param {Function} success
   * @param {Function} error
   * @param {String} traversal
   * @param {String} direction
   */
  publish(data, success: Function = _.noop, error: Function = _.noop, traversal: String = 'breadth', direction: String = 'down'): Promise {
    // ensure data is pure
    data = _.clone(data, true)
    
    // subscribers who match the current published data
    const scrips = this.subscriptions.filter(scrip => !!this.matches(data, scrip).size)

    // current service node. proxy data if this service's data update matches any subscriptions
    const result = scrips.length ? scrips.map(scrip => scrip.on(data)) : data

    // traverse service node tree and publish on each "next" node
    return this.traverse(
      result, traversal, direction, success, error,
      child => {
        child.publish(result, success, error, traversal, direction)
      }
    )
  }

  /**
   * Creates and registers a publish subscription with the Service
   * 
   * @param {String} path
   * @param {Function} on
   */
  subscribe(path: String = '$', on: Function): Subscription {
    const scrip = new Subscription(this, path, on)

    this.subscriptions.push(scrip)

    return scrip
  }

  /**
   * Ends a publish subscription with the Service
   * 
   * @param {Subscription} scrip
   */
  unsubscribe(scrip: Subscription) {
    this.subscriptions.splice(this.subscriptions.indexOf(scrip), 1)
  }

  /**
   * Updates the Service's canonical data source with new data and publishs the change
   * 
   * @param {Object} data
   * @param {?Function} success
   * @param {?Function} error
   * @returns {Promise}
   */
  update(data, success?: Function, error?: Function): Promise {
    this.data = data

    return this.publish(data, success, error)
  }

  /**
   * Merges and updates the Service's canonical date source with a new data object and publishs the change
   * 
   * @param {Object} data
   * @param {?Function} success
   * @param {?Function} error
   * @returns {Promise}
   */
  merge(data: Object, success?: Function, error?: Function): Promise {
    if (_.isObject(data)) {
      _.merge(this.data, data)
    }

    return this.update(this.data, success, error)
  }

  /**
   * Alias for subscribe
   * 
   * @param {String} path
   * @param {Function} on
   * @returns {Subscription}
   */
  on(path: String, on: Function): Subscription {
    return this.subscribe(path, on)
  }

  /**
   * Alias for update
   * 
   * @param {Object} data
   * @param {?Function} success
   * @param {?Function} error
   * @returns {Promise}
   */
  use(data, success?: Function, error?: Function): Promise {
    return this.update(data, success, error)
  }

  /**
   * Alias for merge
   * 
   * @param {Object} data
   * @param {?Function} success
   * @param {?Function} error
   * @returns {Promise}
   */
  up(data, success?: Function, error?: Function): Promise {
    return merge(data, success, error)
  }

  /**
   * Determines sub-of data that matches subscription path/pattern
   * 
   * @param {Object} data
   * @param {?Function} success
   * @param {?Function} error
   * @returns {Set} data matching subscription
   */
  matches(data, scrip: Subscription): Set {
    return scrip.matches(data)
  }

  /**
   * Recursively traverses service tree via provided `next` function
   * 
   * Supported traversals:
   * - [~] Depth-first Up
   * - [X] Depth-first Down
   * - [~] Breadth-first Up
   * - [X] Breadth-first Down
   * - [ ] Async Local {direc}
   * 
   * @param {Object} data
   * @param {String} traversal supported values defined by gooey.traversals
   * @param {String} direction up or down
   * @param {Function} success
   * @param {Function} error
   * @param {Function} next
   * @returns {Promise}
   */
  traverse(data, traversal: String, direction: String, success: Function, error: Function, next: Function): Promise {
    if (!traversals.find(t => t === traversal)) {
      throw `Failed to traverse, invalid traversal type: ${traversal}`
    }

    if (direction === 'down' && this.children.length) {
      if (traversal === 'breadth') {
        return Promise.all(this.children.map(next))
      }

      if (traversal === 'depth') {
        return this.children.map(next)
      }
    }

    if (direction === 'up' && this.parent) { // WIP!
      if (traversal === 'breadth') {
        return Promise.all(
          this.parent.siblings(null, true).map(next)
        )
      }

      if (traversal === 'depth') {
        return this.parent.siblings(null, true).map(next)
      }
    }

    // TODO - async_local traversal

    // end node
    return new Promise((resolve, reject) => {
      try {
        resolve(success(result))
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Establishes strong acyclic child relationship with provided service.
   * Child services inherit publications from their parent.
   * The opposite is also supported via traversals.
   * Silently fails if a cyclic relationship is proposed.
   * 
   * @param {Service} child service to relate to
   * @returns {Service} modified service with new child relationship
   */
  relateTo(child: Service): Service {
    this.children.push(child)

    if (Service.cycleExists()) { // TODO - meh, clean up
      this.children.pop()
    }

    return this
  }

  /**
   * Establishes service as parent to each provided child service.
   * Child services inherit publications from their parent.
   * The opposite is also supported via traversals.
   * 
   * @param {Array} children services to relate to
   * @returns {Array} modified children services with new parent relationship
   */
  relateToAll(children: Array): Array {
    return children.map(c => {
      c.parent = this

      // this.relateTo(c) // TODO/FIXME

      return c
    })
  }

  /**
   * Determines a provided service's depth in the service tree
   * 
   * @param {Service} node relative/starting service
   * @returns {Int}
   */
  depth(node: Service = this): Int {
    let nodeDepth = 0

    while (node.parent) {
      node = node.parent
      nodeDepth += 1
    }

    return nodeDepth
  }

  /**
   * Searches for and returns all siblings of the provided service
   * 
   * @param {Service} node relative/starting service
   * @param {Boolean} global return siblings across disjoint trees (true) or siblings in connected hierarchy (false - UNSUPPORTED)
   * @returns {Int}
   */
  siblings(node = this, global: Boolean = false): Array {
    const roots = Service.findRoots()
    const depth = node.depth()

    return Service.findAtDepth(depth, roots).filter(svc => svc !== node)
  }

  /**
   * Determines if the service is a root node in the local service tree
   * 
   * @returns {Boolean}
   */
  isRoot(): Boolean {
    return !this.parent
  }

  /**
   * Determines if the service is a leaf node in the local service tree
   * 
   * @returns {Boolean}
   */
  isLeaf(): Boolean {
    return !this.children
  }

  /**
   * Determines and returns all root node services in the global service tree
   * 
   * @param {Array} services service tree to search through (default is global)
   * @returns {Array}
   */
  static findRoots(services: Array = _services): Array {
    return _(services).values().filter(svc =>
      (svc instanceof Service) && svc.isRoot()
    ).value()
  }

  /**
   * Determines and returns all leaf node services in the global service tree
   * 
   * @param {Array} services service tree to search through (default is global)
   * @returns {Array}
   */
  static findLeafs(services: Array = _services): Array {
    return _(services).values().filter(svc =>
      (svc instanceof Service) && svc.isLeaf()
    ).value()
  }

  /**
   * Determines and returns the nodes (out of the provided service tree) at the target depth
   * 
   * @param {Int} targetDepth
   * @param {Array} nodes service tree to search through (default is global)
   * @returns {Array}
   */
  static findAtDepth(targetDepth: Int, nodes: Array): Array {
    const found  = []
    let curDepth = 0

    _.forEach(nodes, node => {
      _.forEach(node.children, child => {
        curDepth = child.depth()

        if (curDepth < targetDepth) {
          found.push(...this.findAtDepth(targetDepth, [child]))
        } else if (curDepth === targetDepth) {
          found.push(child)
        }
      })
    })

    return found
  }

  /**
   * Determines if a cyclic relationship exists anywhere in the provided service tree
   * 
   * @param {Array} services service tree to search through (default is global)
   * @returns {Boolean}
   */
  static cycleExists(services = _services): Boolean {
    const roots = Service.findRoots(services)
    const found = !_.isEmpty(roots) ? roots.map(r => r.name) : []

    let curNode = null
    let cyclic  = false

    _.forEach(roots, root => {
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

  /**
   * Determines if a service name is already registered in the global service tree
   * 
   * @returns {Boolean}
   */
  static isRegistered(name: String): Boolean {
    return _.contains(Array.from(_services).map(s => s.name), name)
  }
}

// TODO - may as well make this extend Promise, "on" can be redundant
/**
 * A topic-based data matcher that reacts to a service's publications
 */
export class Subscription {

  /**
   * A topic-based data matcher that reacts to a service's publications
   * 
   * @param {Service} service
   * @param {String} path topic/pattern to react to (* is wildcard)
   * @param {Function} on functionality to be triggered on match
   */
  constructor(service: Service, path: String, on: Function) {
    this.service = service
    this.path = path
    this.on = on
    this.active = true
  }

  /**
   * Determines sub-of data that matches subscription path/pattern
   * 
   * @param   {Object}    data
   * @param   {?Function} success
   * @param   {?Function} error
   * @returns {Set}       data matching subscription
   */
  matches(data): Set {
    const matchSet = new Set()

    if (this.active && this.service.config.data.matching.queries) { // FIXME - determine if jsonpath query via regex
      const jpMatches = jsonPath.query(data, this.path)

      if (jpMatches && !!jpMatches.length) {
        matchSet.add(...jpMatches)
      }
    }

    if (data === this.path && !matchSet.contains(data)) {
      matchSet.add(data)
    }

    return matchSet
  }

  /**
   * Unsubscribes a subscription from its service and mark it as inactive.
   * Subscription will not react to any messages from service until activated again.
   */
  end() {
    service.unsubscribe(this)
    this.active = false
  }

  /**
   * Activates the subscription, permitting it to react to topic-based messages
   */
  activate() {
    this.active = true
  }

}

export var service  = ({name, model, parent, children, config}) => new Service(name, model, parent, children, config) 
export var services = _services
export var clear    = () => { _services = new Set() }

// subscribe to all services and react to any data changes within them matching the provided hash
// export function subscribe(hash: String, callback: Function)

// publish a data change across all services (searches for roots, leafs, and orphans)
// traversal: async_global
// export function publish(path: String, data)

// allows a gooey service tree to be defined througha a convenient meta-descriptive POJO
// export function meta(meta: Object)