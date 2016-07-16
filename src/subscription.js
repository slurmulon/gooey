import { Service } from './service'
import * as topic  from './topic'
import * as util   from './util'

/**
 * A topic-based data matcher that reacts to a service's publications
 */
export class Subscription {

  /**
   * A topic-based data matcher that reacts to a service's publications
   * 
   * @param {Service} service
   * @param {Object} topic topic/pattern to react to ('*' or '$' is wildcard)
   * @param {Function} on functionality to be triggered on successful match
   */
  constructor(service: Service, topic, on: Function) {
    // this.key = key // TODO -> will allow subscriptions to be triggered via simple keys
    this.service = service
    this.topic = topic
    this.on = on
    this.active = true
  }

  /**
   * Determines data or a subset of data that matches subscription topic
   * 
   * @param {*} data
   * @returns {Set} data matching subsubscription
   */
  matches(data): Set {
    const matchSet = new Set()

    if (this.active && this.service.config.data.matching) {
      const topicMatches = topic.identify(this.topic).matches(data)

      if (!util.isEmpty(topicMatches)) {
        matchSet.add(...topicMatches)
      }
    }

    return matchSet
  }

  /**
   * Determines if data matches the subsubscription and, if so, allows
   * the subsubscription to mutate and return the data.
   * 
   * @param {boolean} passive return either untouched data on mismatch (true) or null on mismatch (false)
   * @returns {*} subsubscription modified data
   */
  process(data, passive: boolean = true) {
    return this.matches(data).size ? this.on(data) : (passive ? data : null)
  }

  /**
   * Unsubscribes a subsubscription from its service and mark it as inactive.
   * Subscription will not react to any messages from service until activated again.
   *
   * @param {?boolean} freeze the object after unsubscription, preventing any further changes to Subscription
   */
  end(freeze?: boolean = false) {
    this.service.subscriptions.splice(this.service.subscriptions.indexOf(this), 1)

    this.active = false

    if (freeze) Object.freeze(this)
  }

  /**
   * Activates the subsubscription, permitting it to react to topic-based messages
   */
  start() {
    this.active = true
  }

  /**
   * For sane debugging
   */
  toString() {
    return `[gooey.Service:${this.name}]`
  }

}
