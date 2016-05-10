'use strict'

/**
 * Singleton pool of traversal patterns
 * that can be used in `gooey.Service.publish` events.
 * May be configured with `add(pattern)` or through
 * extension of the `patterns` object directly
 */
export const patterns = {
  breadth: {
    up: function(next) {
      const siblings = this.parent.siblings(undefined, true)

      return Promise.all(
        [this.parent].concat(siblings).map(next)
      )
    },

    down: function(next) {
      return Promise.all(this.children.map(next))
    },

    // bi: function(next, tail)
  },

  depth: {
    down: function(next) {
      return this.children.map(next)
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
export function step(name, direction, next, path = []): Promise {
  const traversal = patterns[name][direction]

  if (traversal) {
    const canNext = direction && !!{
      up   : () => this.parent,
      down : () => this.children.length
    }[direction]()

    console.log('DAT PATH', path)

    const canPath = path.length === 0 || !path.indexOf(this.name)

    console.log('INDEX OF', this.name, path.indexOf(this.name))

    // inner node
    if (canNext && canPath) {
      path.push(this.name)

      return traversal.call(this, next)
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
