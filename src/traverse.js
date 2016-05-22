'use strict'

/**
 * Singleton pool of traversal patterns
 * that can be used in `gooey.Service.publish` events.
 * May be configured with `add(pattern)` or through
 * extension of the `patterns` object directly
 */
export const patterns = {
  breadth: {
    /**
     * Performs Breadth-First Search (leafs -> roots)
     *
     * @param {Function} next stepper function to map on next set of nodes
     * @param {*} data
     * @param {Array} frontier list of visited nodes in traversal
     * @returns {Promise} asynchronous mapping of node "steps"
     */
    up: function(next: Function, data, frontier) {
      const stepper = (node) => next(node, data, frontier)

      // FIXME - scan for sibblings is inefficient (n2), read Beamer paper
      // couple of options to research more:
      // - keep this and don't care if some nodes are visited more than once
      // - integrate Beamer's bottom-up BFS algorithm (has its own noted issues)
      // - build a map of depth -> services, iterating through each depth sequentially (nodes at each depth async)
      // - if a node has an immediate sibling (same parent), ensure only 1 next call to the parent is made across all children (aka siblings of "next" up node)
      const siblings = this.parent.siblings(undefined, true)

      const nodes = [this.parent].concat(siblings).map(stepper)

      return Promise.all(nodes)
    },

    /**
     * Performs Breadth-First Search (roots -> leafs)
     *
     * @param {Function} next stepper function to map on next set of nodes
     * @param {*} data
     * @param {Array} frontier list of visited nodes in traversal
     * @returns {Promise} asynchronous mapping of node "steps"
     */
    down: function(next, data, frontier) {
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
     * @param {Array} frontier list of visited nodes in traversal
     * @returns {Promise} asynchronous mapping of node "steps"
     */
    down: function(next, data, frontier) {
      const stepper = (node) => next(node, data, frontier)

      return Promise.all(this.children.map(stepper))
    }
  }

  // async: { }
}

/**
 * Executes a traversal step with a pattern that's defined
 * in the `traverse.patterns` pool. Passively recursive (user
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
 * @param {String} name `breadth` or `depth`
 * @param {String} direction `up`, `down` or `bi`
 * @param {*} data
 * @param {Function} action function to invoke against data on each step
 * @param {Function} next function to invoke next after node is visited (typically `publish`)
 * @returns {Promise}
 */
export function step(name: string, direction: string, data, action: Function, next: Function, frontier: Array = []): Promise {
  const traversal = patterns[name][direction]

  if (traversal) {
    const canNext = direction && !!{
      up   : () => this.parent,
      down : () => this.children.length
    }[direction]()

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
    return Promise(result).reject('unknown traversal')
  }
}

/**
 * Adds a traversal pattern to the `traverse.patterns`
 * pool. These may be used (by name) in `gooey.Service.publish`
 * and other methods that inherit it.
 *
 * @param pattern {Object}
 */
export function add(pattern) {
  Object.assign(patterns, pattern)
}

/**
 * Allow pattern pool and step function to be accessible
 */
export default { patterns, step }
