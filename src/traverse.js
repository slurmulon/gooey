'use strict'

// export const Direction = {
//   UP   : Symbol('up'),
//   DOWN : Symbol('down'),
//   BI   : Symbol('bi')
// }

export const all = {
  'breadth' : {
    // [Direction.UP]: function(service, next) {
     // up: function(service, next) { 
    up: function(next) {
      // return Promise.all(
      //   [service.parent].concat(service.parent.siblings(null, true))
      // )

      return Promise.all(
        [this.parent].concat(this.parent.siblings(null, true))
      )
    },

    // [Direction.DOWN]: function(service, next) {
    // down: function(service, next) {
    down: function(next) {
      return Promise.all(this.children.map(next))
    }
    // [Direction.BI] - use optimal direction BFS algorithm
  },

  'depth' : {
    // [Direction.DOWN]: function(service, next) {
    'down': function(next) {
      return this.children.map(next)
    }
  },

  'async' : {
    // TODO
  }
}

// 
// export function start(service, name, direction, next): Promise {
export function start(name, direction, next): Promise {
  const traversal = all[name][direction]

  if (traversal) {
    // inner node
    switch (direction) {
      // case Direction.UP   : if (service.parent) return traversal(service, direction); break
      // case Direction.DOWN : if (service.children.length) return traversal(service, direction); break
      // case 'up'   : if (service.parent) return traversal(service, direction, next); break
      // case 'down' : if (service.children.length) return traversal(service, direction, next); break
      case 'up'   : if (this.parent) return traversal.call(this, next); break
      case 'down' : if (this.children.length) return traversal.call(this, next); break
      // 
      // case Direction.BI
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
    // unknown traversal
  }
}

// export class Traversal {

//   constructor(name: String, direction: Direction, next: Function) {
//     this.name = name
//     this.direction = direction
//     this.next = next
//   }

//   start(): Promise {
//     // if (next instanceof Function) {
//     //   next()
//     // }


//     // end node
//     return new Promise((resolve, reject) => {
//       try {
//         resolve(result)
//       } catch (err) {
//         reject(err)
//       }
//     })
//   }

// }


// traverse(data, traversal: String, direction: String, next: Function): Promise {
//   if (!traversals.find(t => t === traversal)) {
//     throw `Failed to traverse, invalid traversal type: ${traversal}`
//   }

//   if (direction === 'down' && this.children.length) {
//     if (traversal === 'breadth') {
//       return Promise.all(this.children.map(next))
//     }

//     if (traversal === 'depth') {
//       return this.children.map(next)
//     }
//   }

//   if (direction === 'up' && this.parent) {
//     if (traversal === 'breadth') {
//       return Promise.all(
//         [this.parent].concat(this.parent.siblings(null, true))
//       )
//     }

//     // if (traversal === 'depth') { // WIP
//     //   return this.parent.siblings(null, true).map(next)
//     // }
//   }

//   // TODO - async_local traversal

//   // end node
//   return new Promise((resolve, reject) => {
//     try {
//       resolve(result)
//     } catch (err) {
//       reject(err)
//     }
//   })
// }