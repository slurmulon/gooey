import * as gooey from 'index.js'

import * as _ from 'lodash'

// or http://www.ericponto.com/blog/2014/10/05/es6-dom-library/
// kinda cool but hacky http://lea.verou.me/2015/04/idea-extending-native-dom-prototypes-without-collisions/
// http://h3manth.com/new/blog/2015/custom-elements-with-es6/

class Component extends HTMLElement, gooey.Service {

  constructor(name: String, template: String, model: Function) {
    this.name = name
    this.template = template
    this.model = model

    document.registerElement(DomElem.camelToSnake(this.name), DomElem)
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
