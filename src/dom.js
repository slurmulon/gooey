import * as gooey from 'index.js'

var _ = require('lodash')

export class WebComponent extends gooey.Service {

  constructor(name: String, factory?: Function, parent?: Service, children?: Array = [], config?: Object = _config) {
    super(...arguments)
  }

  subscribe(path: String, then?: Function) {
    super.subscribe(path, then)

    // TODO
  }

  update()

}
