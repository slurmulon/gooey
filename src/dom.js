import * as gooey from './index'
import * as _ from 'lodash'

// or http://www.ericponto.com/blog/2014/10/05/es6-dom-library/
// kinda cool but hacky http://lea.verou.me/2015/04/idea-extending-native-dom-prototypes-without-collisions/
// http://h3manth.com/new/blog/2015/custom-elements-with-es6/

export class DomElem extends gooey.Service {//, HTMLElement {

  constructor(name: String, template: String, controller: Function) {
    super(name, model)

    this.name = name
    this.template = template
    this.controller = controller
  }

  default elemProto(): Prototype {
    return Object.create(HTMLElement.prototype, _.values())
  }

  validate() {
    return document.createElement(this.name).__proto__ == HTMLElement.prototype
  }

  // instance of the element is created.
  createdCallback() {}

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

  static dashToCamel(txt: String) {
    return txt.toLowerCase().replace(/-(.)/g, (match, group1) => { group1.toUpperCase() }
  }

  static camelToDash(txt: String) {
    return txt.toLowerCase().replace(/[A-Z]*/g, (match, group1) => { group1.toLowerCase() + '-' }
  }

}

export var element = (name, template, model) => new DomElem(...arguments)

// TODO - class Component