'use strict'

//  ▄▄ •             ▄▄▄ . ▄· ▄▌
// ▐█ ▀ ▪▪     ▪     ▀▄.▀·▐█▪██▌
// ▄█ ▀█▄ ▄█▀▄  ▄█▀▄ ▐▀▀▪▄▐█▌▐█▪
// ▐█▄▪▐█▐█▌.▐▌▐█▌.▐▌▐█▄▄▌ ▐█▀·.
// ·▀▀▀▀  ▀█▄▀▪ ▀█▄▀▪ ▀▀▀   ▀ • 

import jsonPath from 'jsonpath'

import * as traversals from './traverse'
import * as _util from './util'

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
 * A canonical, hierarchical, and composable data source that can publish and receive updates bi-directionally with other services
 * Forms a full k-ary tree that exists in a global forest
 */
export class Service {

  /**
   * Creates and registers a new gooey service with the current module
   * 
   * @param {String} name
   * @param {?Function} model
   * @param {?Service} parent
   * @param {?Array} children
   * @param {?Object} config
   */
  constructor(name: String, model?: Function, parent?: Service, children?: Array = [], config?: Object = _config) {
    if (Object.is(name, undefined) || Service.isRegistered(name)) {
      throw `Services must have unique names: ${name}`
    }

    this.name = name
    this.model = model
    this.state = {}
    this.parent = parent instanceof Service ? parent.relateTo(this) : null
    this.children = this.relateToAll(children)
    this.subscriptions = []
    this.config = config
    this.symbol = Symbol(name)

    _services[name] = this

    if (this.model instanceof Function) {
      this.model(this.state)
    }
  }

  /**
   * Getter alias for `data`
   *
   * @returns {Object}
   */
  get data() {
    return this.state
  }

  /**
   * Setter for `data` that automatically publishes changes with default traversal settings
   *
   * @param {Object} data
   */
  set data(data: Object) {
    this.update(data)
  }

  /**
   * Traverses service tree via a conflict-free path and matches subscribers against the published data
   * 
   * @param {Object} data
   * @param {?String} traversal
   * @param {?String} direction
   * @returns {Promise} deferred service tree traversal(s)
   */
  // TODO - Allow users to publish data with a certain key
  // - that way you aren't forced to always write a JsonPath or matcher function for each subscribe / publish
  publish(data, traversal: String = 'breadth', direction: String = 'down'): Promise {
    return new Promise((resolve, reject) => {
      // ensure data is pure
      data = Object.assign({}, data)

      // process data against matching subscribers
      const matches = this.subscriptions.map(subscrip => subscrip.process(data, false))

      // final result is either converged conflict-resolved subscriber match or cloned source data 
      const result = matches[0] || data

      // traverse service node tree and publish on each "next" node
      return this.traverse(traversal, direction,
        next => next.publish(result, traversal, direction)
      )
    })
  }

  /**
   * Creates and registers a publish subsubscription with the Service
   * 
   * @param {String} path
   * @param {Function} on
   */
  subscribe(path: String = '$', on: Function): Subscription {
    const subscrip = new Subscription(this, path, on)

    this.subscriptions.push(subscrip)

    return subscrip
  }

  /**
   * Deregisters a subsubscription from the Service
   * 
   * @param {Subscription} subscrip
   */
  unsubscribe(subscrip: Subscription) {
    this.subscriptions.splice(this.subscriptions.indexOf(subscrip), 1)
  }

  /**
   * Updates the Service's canonical data source with new data and publishs the change
   * 
   * @param {Object} data
   * @returns {Promise}
   */
  update(data: Object, ...rest): Promise {
    this.state = data

    return this.publish(data, ...rest)
  }

  /**
   * Merges and updates the Service's canonical date source with a new (cloned) data object and publishs the change
   * 
   * @param {Object} data
   * @param {?Function} error
   * @returns {Promise}
   */
  merge(data: Object, ...rest): Promise {
    const merged = data instanceof Object ? Object.assign({}, this.state, data) : this.state

    return this.update(merged, ...rest)
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
   * @returns {Promise}
   */
  use(data, ...rest): Promise {
    return this.update(data, ...rest)
  }

  /**
   * Alias for merge
   * 
   * @param {Object} data
   * @returns {Promise}
   */
  up(data, ...rest): Promise {
    return this.merge(data, ...rest)
  }

  /**
   * Determines set of data that matches the provided subsubscription's path/pattern
   * 
   * @param {Object} data
   * @param {Subscription} subscrip
   * @returns {Set}
   */
  matches(data, subscrip: Subscription): Set {
    return subscrip.matches(data)
  }

  /**
   * Recursively traverses service tree via provided `next` function
   * 
   * @param {String} traversal supported values defined by gooey.traverse.patterns
   * @param {String} direction up, down or bi
   * @param {Function} next
   * @returns {Promise}
   */
  traverse(traversal: String, direction: String, next: Function): Promise {
    return traversals.step.call(this, traversal, direction, next)
  }

  /**
   * Establishes strong acyclic child relationship with provided service.
   * Child services inherit publications from their parent.
   * The opposite is also supported via `up` traversals.
   * Silently fails if a cyclic relationship is proposed.
   * 
   * @param {Service} child service to relate to
   * @returns {Service} modified service with new child relationship
   */
  relateTo(child: Service): Service {
    this.children.push(child)

    if (Service.cycleExists()) {
      this.children.pop() // FIXME - bleh, needs improvement to say the least
    }

    return this
  }

  /**
   * Establishes service as parent to each provided child service.
   * Child services inherit publications from their parent.
   * The opposite is also supported via `up` traversals.
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
   * @param {?Boolean} global return siblings across disjoint trees (true) or siblings in connected hierarchy (false - UNSUPPORTED)
   * @returns {Int}
   */
  siblings(node = this, global?: Boolean = false): Array {
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
    return Object.values(services).filter(svc => svc instanceof Service && svc.isRoot())
  }

  /**
   * Determines and returns all leaf node services in the global service tree
   * 
   * @param {Array} services service tree to search through (default is global)
   * @returns {Array}
   */
  static findLeafs(services: Array = _services): Array {
    return Object.values(services).filter(svc => svc instanceof Service && svc.isLeaf())
  }

  /**
   * Determines and returns the nodes (out of the provided service tree) at the target depth
   * 
   * @param {Int} targetDepth
   * @param {Array} nodes service tree to search through (default is global)
   * @returns {Array}
   */
  static findAtDepth(targetDepth: Int, nodes: Array = []): Array {
    const found  = []
    let curDepth = 0

    nodes.forEach(node => {
      (node.children || []).forEach(child => {
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
    const roots = Service.findRoots(services) || []
    const found = !util.isEmpty(roots) ? roots.map(r => r.name) : []

    let curNode = null
    let cyclic  = false

    roots.forEach(root => {
      curNode = root

      while (!cyclic && !util.isEmpty(curNode.children)) {
        (curNode.children || []).forEach(child => {
          if (!found.includes(child.name)) {
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
    return Array.from(_services).map(serv => serv.name).includes(name)
  }
}

/**
 * A topic-based data matcher that reacts to a service's publications
 */
export class Subscription {

  /**
   * A topic-based data matcher that reacts to a service's publications
   * 
   * @param {Service} service
   * @param {String} path topic/pattern to react to (* is wildcard)
   * @param {Function} on functionality to be triggered on successful match
   */
  constructor(service: Service, path: String, on: Function) {
    this.service = service
    this.path = path
    this.on = on
    this.active = true
  }

  /**
   * Determines sub-of data that matches subsubscription path/pattern
   * 
   * @param {Object} data
   * @returns {Set} data matching subsubscription
   */
  matches(data): Set {
    const matchSet = new Set()

    if (this.active && this.service.config.data.matching.queries) { // FIXME - determine if jsonpath query via regex
      const jpMatches = jsonPath.query(data, this.path)

      if (jpMatches && jpMatches.length) {
        matchSet.add(...jpMatches)
      }
    }

    if (data === this.path && !matchSet.contains(data)) {
      matchSet.add(data)
    }

    return matchSet
  }

  /**
   * Determines if data matches the subsubscription and, if so, allows
   * the subsubscription to mutate and return the data.
   * 
   * @param {Object} data
   * @param {Boolean} passive return either untouched data on mismatch (true) or null on mismatch (false)
   * @returns {Object} subsubscription modified data
   */
  process(data, passive: Boolean = true): Object {
    return this.matches(data).size ? this.on(data) : (passive ? data : null)
  }

  /**
   * Unsubscribes a subsubscription from its service and mark it as inactive.
   * Subscription will not react to any messages from service until activated again.
   */
  end() {
    service.unsubscribe(this)

    this.active = false
  }

  /**
   * Activates the subsubscription, permitting it to react to topic-based messages
   */
  activate() {
    this.active = true
  }

  toString() {
    return `[gooey.${this.name}]: ${JSON.stringify(this)}`
  }

}

/**
 * Alternative destructured alias or Service constructor
 * 
 * @param {String} name
 * @param {?Function} model
 * @param {?Service} parent
 * @param {?Array} children
 * @param {?Object} config
 * @returns {Service}
 */
export var service = ({name, model, parent, children, config}) => new Service(name, model, parent, children, config)

/**
 * Exported flat map of module services - to be used with caution
 */
export var services = _services

/**
 * Convenience reference to utility module
 */
export const util = _util

/**
 * Detaches services from module
 */
export const clear = () => { _services = new Set() }

/**
 * Logger for establishing a consistent message format
 */
export const log = (msg: String, level: String) => `[gooey:${level || 'INFO'}] ${msg}`
