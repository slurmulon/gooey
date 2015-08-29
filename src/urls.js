import * as gooey from 'index.js'

var _routes = {}

export class Route extends Service {

  constructor({path: String, view: String, model: Function, enter?: Function, leave?: Function, last: Boolean = false}) {
    super(path, model, null, uses)

    this.path  = path
    this.view  = view
    this.model = model
    this.enter = enter
    this.leave = leave
    this.last  = last

    _routes[this.path] = this
  }

  visit() {
    // redirect browser to this page
  }

  absoluteUrl() {

  }

  relativeUrl() {

  }

  uriParams() {

  }

  queryParams() {

  }

}

export var route = ({path, view, model, last}) => new Route(...arguments)
