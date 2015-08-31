import * as gooey from 'index.js'

import * as _ from 'lodash'



class DomService extends gooey.Service {

  constructor(name: String, template: String, model: Function) {
    this.name = name
    this.template = template
    this.model = model
  }

  elem() {
    // HTMLElement
    document.registerElement(DomService.camelToSnake(this.name), HtmlElement)
  }

  // Fires when an instance of the element is created.
  createdCallback() {}

  // Fires when an instance was inserted into the document.
  attachedCallback() {}

  // Fires when an instance was removed from the document.
  detachedCallback() {}

  // Fires when an attribute was added, removed, or updated.
  attributeChangedCallback(attr, oldVal, newVal) {}

  static snakeToCamel(txt: String) {
    // TODO
    return txt
  }

  static camelToSnake(txt: String) {
    // TODO
    return txt
  }
}

export var component = (name, template, model) => new Component(...arguments)
