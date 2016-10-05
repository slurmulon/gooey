/**
 * Singleton pool of traversal strategies
 * that can be used in `gooey.Service.publish` events.
 * May be configured with `add(strategy)` or through
 * extension of the `strategies` object directly
 */
export const strategies = {
  breadth: {
    /**
     * Performs Breadth-First Search (leafs -> roots)
     *
     * @param {Function} next stepper function to map on next set of nodes
     * @param {*} data
     * @param {Array<Service>} frontier list of visited nodes in traversal
     * @returns {Promise} asynchronous mapping of node "steps"
     */
    up: function (next: Function, data, frontier: Array) {
      const stepper  = (node) => next(node, data, frontier)
      const siblings = this.parent.siblings(undefined, true)
      const nodes    = [this.parent].concat(siblings)

      return Promise.all(nodes.map(stepper))
    },

    /**
     * Performs Breadth-First Search (roots -> leafs)
     *
     * @param {Function} next stepper function to map on next set of nodes
     * @param {*} data
     * @param {Array<Service>} frontier list of visited nodes in traversal
     * @returns {Promise} asynchronous mapping of node "steps"
     */
    down: function (next: Function, data, frontier: Array) {
      const stepper = (node) => next(node, data, frontier)

      return Promise.all(this.children.map(stepper))
    },

    // http://www.cs.berkeley.edu/~sbeamer/beamer-sc2012.pdf
    // bi: function(next, tail)
  },

  depth: {
    /**
     * Performs Depth-First Search (roots -> leafs)
     *
     * @param {Function} next stepper function to map on next set of nodes
     * @param {*} data
     * @param {Array<Service>} frontier list of visited nodes in traversal
     * @returns {Promise} asynchronous mapping of node "steps"
     */
    down: function (next: Function, data, frontier: Array) {
      const stepper = (node) => next(node, data, frontier)

      return this.children.map(stepper)
    }
  }

  // async: { }
}

/**
 * Executes a traversal step with a strategy that's defined
 * in the `traverse.strategies` pool. Passively recursive (user
 * must explicitly call `traversal.step` again in their
 * `next` function!)
 *
 * Progression to the user-provided `next` function
 * depends on the direction of the traversal and
 * whether or not `traverse.step` is recursively
 * called in the `next` function.
 *
 * Patterns are strongly encouraged to strictly utilize
 * `Promise`s although it's technically not required.
 *
 * @param {string} name `breadth` or `depth`
 * @param {string} direction `up`, `down` or `bi`
 * @param {*} data
 * @param {Function} action function to invoke against data on each step
 * @param {Function} next function to invoke next after node is visited (typically `publish`)
 * @returns {Promise}
 */
export function step (name: string, direction: string, data, action: Function, next: Function, frontier: Array = []): Promise {
  const traversal = strategies[name][direction]

  if (traversal) {
    const canNext = direction && !!{
      up   : this.parent,
      down : this.children.length
    }[direction]

    const canAddToFrontier = frontier.length === 0 || !~frontier.indexOf(this.name)

    // visit current service node via `action`
    if (canAddToFrontier) {
      const result = action(data)

      // once result is acquired, add service name to frontier
      frontier.push(this.name)

      // progress to next traversal step if necessary
      return canNext ? traversal.call(this, next, result, frontier) : Promise(result)
    }

    // unvisited node result
    return Promise(result)
  } else {
    return Promise(result).reject(`unknown traversal. name: ${name}, direction: ${direction}`)
  }
}

/**
 * Adds a traversal strategy to the `traverse.strategies`
 * pool. These may be used (by name) in `gooey.Service.publish`
 * and other methods that inherit it.
 *
 * @param {Object} strategy
 */
export function add (strategy) {
  Object.assign(strategies, strategy)
}

export default { strategies, step, add }
