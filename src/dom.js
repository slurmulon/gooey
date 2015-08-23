import * as gooey from 'index.js'

import * as _ from 'lodash'

// FIXME - extend native dom class
// or http://www.ericponto.com/blog/2014/10/05/es6-dom-library/
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
