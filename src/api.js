import * as gooey from 'index.js'

export class HttpResource extends Service {

  contructor(slug: String,) {

  }

}

export var httpResource = ({name, template, model}) => new HttpResource(...arguments}) 
