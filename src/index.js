'use strict';

var _ = require('lodash')

// Terminology:
// - hash: A service name or JsonPath query (e.g, 'users', or '$.user')
var services = []

var config = {
  data: {
    sync: {
      greedy  : true
    },
    matching: {
      queries : true
    }  
  },

  errors: { }
}

var directions = ['up', 'down', 'bi']

// a canonical, heiarchical source of data that can delegate updates to child sources
export class Service {

  constructor({name: String, factory: Function, parent?: Service, ...children?, config?: Object=config}) {
    this.name        = name
    this.parent      = parent
    this.children    = children // TODO - ensure that child services can cross-communicate with parents
    this.config      = config
    this.scope       = {}
    this.subscribers = []

    // TODO - if service is root, enforce configuration to all child services
    
    services.push(this)

    factory(scope) // TODO - also pass in core services for http and dom
  }

  broadcast({hash: String, data, success?: Function, error?: Function, direction: String='bi'}) {
    // # Algorithm
    // ---------------------------
    // If direction is up
    // Find parents of this service
    //    traverse parent services based on greedy config
    // NOTE - this is more difficult to implement, especially concurrently (even in binary tree, 1 parent with 2 children, the 2 children broadcasting to parent be unsafe)
    //   however, can be more efficient and sane since  we will start at only relevant leaf nodes and only relevant parents are affected

    // If direction is down
    // Find children of this service
    //    traverse child services based on greedy config

    // look at node
    //    call success callback with data if service matches hash
    //    anything worth broadcasting to?
    // if greedy
    //    look at next node asynchronously
    // if not greedy
    //     wait for subscribers to handle responses, then


    // # Order of data synchronization (greedy config)
    // ---------------------------
    //  Greedy
    //   1. all service children
    //   2. all subscribers matching the hash

    //  Non-Greedy
    //   1. all subscribers matching the hash at current depth
    //   2. all service children


    // FIXME - look through all subscribers for a match - this will certainly be an efficiency bottle-neck
    let matches = true

    // current service node, process data if this service's data update matches any subscriptions
    let result = matches ? success(data) : null

    // non-leaf node services
    if (children.length) {
      children.forEach(child => {
        // traverse depth as quickly as possible (async depth, greedy)
        if (config.data.sync.greedy) {
          let childResults = new Promise((resolve, reject) => {
            let childResult = child.broadcast({hash, data: result, success, error, direction})

            resolve({name: child.name, result: childResult})
            // TODO - reject
          })

          return childResults
        // traverse depth iteratively (synchronous depth, non-greedy)
        } else {
          let depthResults = subscribers.map(scribe => {
            return new Promise((resolve, reject) => {
              //resolve({scribe.name, scribe.broadcast(...arguments)})
              // TODO - reject
            })
          })
        }
      })
    }

    // leaf node service
    return new Promise((resolve, reject) => { resolve({name, result}) })
  }

  subscribe(hash: String, callback?: Function) {
    subscribers.push({hash, callback})
  }

  update(data, success?: Function, error?: Function) {
    this.scope = data
    broadcast('*', success, error)
  }

  set relate(child: Service) {
    this.children.push(child)
  }

}

export function service(name: String, factory?: Function) {
  return new Service(name, factory)
}

// subscribe to all services and react to any data changes withem them matching the provided hash
// export function subscribe(hash: String, callback: Function)

// export function broadcast(hash: String, data)
