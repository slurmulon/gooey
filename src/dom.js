import * as gooey from 'index.js'

var _ = require('lodash')

export class DomService extends gooey.Service {

  constructor(name: String, factory: Function, parent?: Service, children?: Set, config?: Object) {
    super(...arguments)
  }

  subscribe(pattern: String, then?: Function) {
    super.subscribe(pattern, then)

    // TODO
  }

}
