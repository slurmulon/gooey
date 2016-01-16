'use strict'

// TODO - support "bi" direction
// TODO - support history "tail"
export const patterns = {
  breadth : {
    up: function(next) {
      return Promise.all(
        [this.parent].concat(this.parent.siblings(null, true))
      )
    },

    down: function(next) {
      return Promise.all(this.children.map(next))
    }
  },

  depth: {
    down: function(next) {
      return this.children.map(next)
    }
  },

  async: { }
}

export function start(name, direction, next): Promise {
  const traversal = patterns[name][direction]

  if (traversal) {
    // inner node
    switch (direction) {
      case 'up'   : if (this.parent) return traversal.call(this, next)
      case 'down' : if (this.children.length) return traversal.call(this, next)
    }

    // end node
    return new Promise((resolve, reject) => {
      try {
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  } else {
    // WARN/ERROR - unknown traversal
  }
}

export default { patterns, start }
