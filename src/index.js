'use strict'

// Terminology:
// - hash: A service name or JsonPath query (e.g, 'users', or '$.user')

var config = {
  data: {
    sync: {
      greedy  : false,
      breadth : false,
      depth   : true
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

  constructor(name: string, children=[], config?: Object=config) {
    this.name        = name
    this.children    = children // TODO - ensure that child services can cross-communicate with parents
    this.config      = config
    this.scope       = {}
    this.subscribers = []

    services.push(this)
  }

  broadcast(hash: string, data, success?: Function, error?: Function, direction: String='bi') {
    // TODO - synchronize data to (order based on `data.sync.greedy` config)
    //  Greedy
    //   - 1. all service children
    //   - 2. all subscribers matching the hash

    //  Non-Greedy
    //   - 1. all subscribers matching the hash
    //   - 2. all service children

    // TODO - integrate with Q or async and return promise
  }

  subscribe(hash: string, callback?: Function) {
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

export function service(name: string, factory?: Function, dispatchers: Object) {
  return new Service(name, factory, dispathers)
}

// subscribe to all services and react to any data changes withem them matching the provided hash
// export function subscribe(hash: string, callback: Function)

// export function broadcast(hash: string, data)
