import { Subscription } from './subscription'
import { step } from './traverse'
import { isEmpty, values as valuesIn } from './util'

/**
 * Map of all registered services, indexed by name
 */
let _services = Object.create(null)

/**
 * Default service configuration object
 */
let _config = {
  data: {
    matching: true,

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
   * @param {tring} name
   * @param {Function} [model]
   * @param {*} [state]
   * @param {Service} [parent]
   * @param {Array<Service>} [children]
   * @param {Object} [config]
   */
  constructor(
    name      : string,
    model?    : Function,
    state?    : Object = {},
    parent?   : Service,
    children? : Array  = [],
    config?   : Object = _config
  ) {
    if (Object.is(name, void 0) || Service.isRegistered(name)) {
      throw `Services must have unique names: ${name}`
    }

    this.name  = name
    this.model = model
    this.state = state

    this.parent   = parent ? parent.relateTo(this) : null
    this.children = this.relateToAll(children)
    this.subscriptions = []

    this.config = config
    this.symbol = Symbol(name)

    _services[name] = this

    if (this.model instanceof Function) {
      this.model(this.state, this)
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
   * @param {*} data
   */
  set data(data) {
    this.update(data)
  }

  /**
   * Traverses service tree via a conflict-free frontier and matches subscribers against the published data
   *
   * @param {*} data
   * @param {String} [traversal]
   * @param {String} [direction]
   * @param {Array<Service>} [frontier] tracks all services encountered during publication. use caution with overriding this value.
   * @returns {Promise} deferred service tree traversal(s)
   */
  // TODO - Allows users to provide a custom collision resolver
  // TODO - Allow users to publish data with a simple key
  publish(data, traversal: string = 'breadth', direction: string = 'down', frontier: Array = []): Promise {
    return new Promise((resolve, reject) => {
      // ensure data is pure
      data = data instanceof Object ? Object.assign({}, data) : data

      // action to perform on this node's step traversal
      // (deferred in case traversal circumevents the need)
      const action = (data) => {
        const matches = this.subscriptions.map(subscrip => subscrip.process(data, false))

        return matches[0] || data
      }

      // recursively calls publish on next node (lazily evalutated during tree traversal)
      const next = (node, result, frontier) => node.publish(result, traversal, direction, frontier)

      // traverse service node tree and publish result on each "next" node
      return this.traverse(
        traversal, direction, data, action, next, frontier
      )
    })
  }

  /**
   * Creates and registers a publish subsubscription with the Service
   *
   * @param {Topic|String} topic
   * @param {Function} [on]
   */
  subscribe(topic = '*', on?: Function = _ => _): Subscription {
    const subscrip = new Subscription(this, topic, on)

    this.subscriptions.push(subscrip)

    return subscrip
  }

  /**
   * Deregisters a subsubscription from the Service
   *
   * @param {Subscription} subscrip
   * @param {boolean} freeze
   */
  unsubscribe(subscrip: Subscription, freeze: boolean = false) {
    subscrip.end(freeze)
  }

  /**
   * Updates the Service's canonical data source with new data and publishs the change
   *
   * @param {*} data
   * @returns {Promise}
   */
  update(data, ...rest): Promise {
    this.state = data

    return this.publish(data, ...rest)
  }

  /**
   * Merges and updates the Service's canonical data source with a new (cloned)
   * data object and publishs the change
   *
   * @param {*} data
   * @param {Function} [error]
   * @returns {Promise}
   */
  merge(data, ...rest): Promise {
    const merged = data instanceof Object ? Object.assign({}, this.state, data) : this.state

    return this.update(merged, ...rest)
  }

  /**
   * Appends to the Service's canonical data if it's a collection and then
   * publishes the change
   *
   * @param {*} data
   * @param {Function} [error]
   * @returns {Promise}
   */
  add(data, ...rest): Promise {
    if (this.state instanceof Array) {
      this.state.push(data)
      this.update(this.state, ...rest)
    }
  }

  /**
   * Alias for update
   *
   * @param {*} data
   * @returns {Promise}
   */
  use(data, ...rest): Promise {
    return this.update(data, ...rest)
  }

  /**
   * Alias for merge
   *
   * @param {*} data
   * @returns {Promise}
   */
  up(data, ...rest): Promise {
    return this.merge(data, ...rest)
  }

  /**
   * Alias for subscribe
   *
   * @param {Topic|String} topic
   * @param {Function} on
   * @returns {Subscription}
   */
  on(topic, on: Function): Subscription {
    return this.subscribe(topic, on)
  }

  /**
   * Alias for unsubscribe
   *
   * @param {Subscription} subscrip
   * @param {boolean} freeze
   */
  off(subscrip: Subscription, freeze: boolean = false) {
    return this.unsubscribe(subscrip, freeze)
  }

  /**
   * Determines set of data that matches the provided subsubscription's topic
   *
   * @param {*} data
   * @param {Subscription} subscrip
   * @returns {Set}
   */
  matches(data, subscrip: Subscription) { // TODO - report issue with flow, value gets coerced to Array
    return subscrip.matches(data)
  }

  /**
   * Recursively traverses service tree via provided `next` function
   *
   * @param {string} traversal supported values defined by gooey.traverse.strategies
   * @param {string} direction up, down or bi
   * @param {Array<Service>} [frontier] tracks all services encountered during publication
   * @param {Promise|Function} next
   * @returns {Promise}
   */
  traverse(traversal: string, direction: string, data, action: Function, next: Function, frontier: Array): Promise {
    return step.call(this, traversal, direction, data, action, next, frontier)
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

    // if (Service.cycleExists()) {
    //   this.children.pop() // FIXME - bleh, needs improvement to say the least
    // }

    return this
  }

  /**
   * Establishes service as parent to each provided child service.
   * Child services inherit publications from their parent.
   * The opposite is also supported via `up` traversals.
   *
   * @param {Array<Service>} children services to relate to
   * @returns {Array<Service>} modified children services with new parent relationship
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
   * @returns {number} depth of service
   */
  depth(node: Service = this): number {
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
   * @param {Service} [node] relative/starting service
   * @param {boolean} [globe] return siblings across disjoint trees (true) or siblings in connected hierarchy (false - UNSUPPORTED)
   * @returns {Array<Service>} siblings of service
   */
  siblings(node: Service = this, globe?: boolean = false): Array {
    const roots = Service.findRoots()
    const depth = node.depth()

    return Service.findAtDepth(depth, roots).filter(svc => svc !== node)
  }

  /**
   * Determines if the service is a root node in the local service tree
   *
   * @returns {boolean}
   */
  isRoot(): boolean {
    return isEmpty(this.parent)
  }

  /**
   * Determines if the service is a leaf node in the local service tree
   *
   * @returns {boolean}
   */
  isLeaf(): boolean {
    return isEmpty(this.children)
  }

  /**
   * Determines and returns all root node services in the global service tree
   *
   * @param {Array<Service>} [services] service tree to search through (default is global)
   * @returns {Array<Service>}
   */
  static findRoots(services = _services): Array {
    return valuesIn(services).filter(svc => svc instanceof Service && svc.isRoot())
  }

  /**
   * Determines and returns all leaf node services in the global service tree
   *
   * @param {Array<Service>} [services] service tree to search through (default is global)
   * @returns {Array<Service>}
   */
  static findLeafs(services = _services): Array {
    return valuesIn(services).filter(svc => svc instanceof Service && svc.isLeaf())
  }

  /**
   * Determines and returns the nodes (out of the provided service tree) at the target depth
   *
   * @param {number} targetDepth
   * @param {Array<Service>} [nodes] service tree to search through (default is global)
   * @returns {Array<Service>}
   */
  static findAtDepth(targetDepth: number, nodes: Array = []): Array {
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
   * @param {Array<Service>} [services] service tree to search through (default is global)
   * @returns {boolean}
   */
  static cycleExists(services = _services): boolean {
    const roots = Service.findRoots(services) || []
    const found = roots.map(r => r.name)
    const hasRoots    = !isEmpty(roots)
    const hasServices = !isEmpty(services)

    if (!hasRoots && hasServices) {
      return true
    }

    let curNode = null
    let cyclic  = false

    roots.forEach((root, i) => {
      curNode = root

      while (!cyclic && !isEmpty(curNode.children)) {
        (curNode.children || []).forEach(child => {
          if (!~found.indexOf(child.name)) {
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
   * @param {string} name
   * @returns {boolean}
   */
  static isRegistered(name: string): boolean {
    return Array.from(_services).map(serv => serv.name).indexOf(name) >= 0
  }

}

/**
 * Alternative destructured alias or Service constructor
 * 
 * @param {string} name
 * @param {Function} [model]
 * @param {*} [state]
 * @param {Service} [parent]
 * @param {Array<Service>} [children]
 * @param {Object} [config]
 * @returns {Service}
 */
export const service = ({ name, model, state, parent, children, config }) => new Service(name, model, state, parent, children, config)

/**
 * Exported flat map of module services - to be used with caution
 */
export const services = (() => _services)

/**
 * Detaches services from module
 */
export const clear = () => { _services = {} }
