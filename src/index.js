'use strict';

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
    // FIXME - look through all subscribers for a match - this will certainly be an efficiency bottle-neck
    let matches = true

    // current service node, process data if this service's data update matches any subscriptions
    let result = matches ? success(data) : null

    // direction: down
    if (children.length) {
      // parallelize breadth, synchronize depth
      return Promise.all(children.map(child => {
        return child.broadcast({hash, data: result, success, error, direction})
      }))
    }

    // reached leaf node
    return new Promise((resolve, reject) => { resolve({name: this.name, result}) })
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
