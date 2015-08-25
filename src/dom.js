import * as gooey from './index'
import * as _ from 'lodash'

// or http://www.ericponto.com/blog/2014/10/05/es6-dom-library/
// kinda cool but hacky http://lea.verou.me/2015/04/idea-extending-native-dom-prototypes-without-collisions/
// http://h3manth.com/new/blog/2015/custom-elements-with-es6/

export class DomElem extends gooey.Service {//, HTMLElement {

  constructor(name: String, template: String, controller: Function, on: Object = {}) {
    super(name, model)

    this.name = name
    this.template = template
    this.controller = controller
    this.on = on

    document.registerElement(DomElem.camelToSnake(this.name), DomElem)
  }

  // instance of the element is created.
  createdCallback() {
    // TODO - inject template if exists
    if (this.template) {

    }
  }

  // instance was inserted into the document.
  attachedCallback() {}

  // instance was removed from the document.
  detachedCallback() {}

  // attribute was added, removed, or updated.
  attributeChangedCallback(attr, oldVal, newVal) {
    if((this.on.click || _.noop)(attr, oldVal, newVal)) {
      this.broadcast(newVal) // meh, improve
    }
  }

  static snakeToCamel(txt: String) {
    // TODO
    return txt
  }

  static camelToSnake(txt: String) {
    // TODO
    return txt
  }

}

export var element = (name, template, model) => new DomElem(...arguments)

// TODO - class Component