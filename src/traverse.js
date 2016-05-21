'use strict'

/**
 * Singleton pool of traversal patterns
 * that can be used in `gooey.Service.publish` events.
 * May be configured with `add(pattern)` or through
 * extension of the `patterns` object directly
 */
export const patterns = {
  breadth: {
    // FIXME - redo this bit, don't need to call `next` on every single node (they don't all need to report up to their parents)
    up: function(next, path) {
      const stepper = (node) => next(node, path)

      // FIXME - super inefficient, read Beamer paper
      // couple of options:
      // - keep this and don't care if some nodes are visited more than once
      // - integrate Beamer's bottom-up BFS algorithm
      // - build a map of depth -> services, iterating through each depth sequentially (nodes at each depth async)
      const siblings = this.parent.siblings(undefined, true)

      return Promise.all(
        [this.parent].concat(siblings).map(stepper)
      )
    },

    down: function(next, path) {
      const stepper = (node) => next(node, path)

      return Promise.all(this.children.map(stepper))
    },

    // http://www.cs.berkeley.edu/~sbeamer/beamer-sc2012.pdf
    // bi: function(next, tail)
  },

  depth: {
    down: function(next, path) {
      const stepper = (node) => next(node, path)

      return this.children.map(stepper)
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
 * @param name {String}
 * @param direction {String}
 * @param next {Function}
 */
export function step(name: string, direction: string, next: Function, path: Array = []): Promise {
  const traversal = patterns[name][direction]

  if (traversal) {
    const canNext = direction && !!{
      up   : () => this.parent,
      down : () => this.children.length
    }[direction]()

    const canPath = path.length === 0 || !~path.indexOf(this.name)

    // inner node
    if (canNext && canPath) {
      path.push(this.name)

      return traversal.call(this, next, path)
    }

    // last node
    return Promise(result)
  } else {
    // WARN/ERROR - unknown traversal
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
