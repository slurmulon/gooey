import { Service  } from './service'
import { identify } from './topic'
import { isEmpty  } from './util'

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
   * @returns {Set} data matching subscription
   */
  matches(data): Set {
    const matchSet = new Set()

    if (this.active && this.service.config.data.matching) {
      const topicMatches = identify(this.topic).matches(data)

      if (!isEmpty(topicMatches)) {
        matchSet.add(...topicMatches)
      }
    }

    return matchSet
  }

  /**
   * Determines if data matches the subscription and, if so, allows
   * the subscription to mutate and return the data.
   *
   * @param {boolean} passive return either untouched data on mismatch (true) or null on mismatch (false)
   * @returns {*} subscription modified data
   */
  process(data, passive: boolean = true) {
    return this.matches(data).size ? this.on(data) : (passive ? data : null)
  }

  /**
   * Unsubscribes a subscription from its service and mark it as inactive.
   * Subscription will not react to any messages from service until activated again.
   *
   * @param {boolean} [freeze] freeze the object after unsubscription, preventing any further changes to Subscription
   */
  end(freeze?: boolean = false) {
    this.service.subscriptions.splice(this.service.subscriptions.indexOf(this), 1)

    this.active = false

    if (freeze) Object.freeze(this)
  }

  /**
   * Activates the subscription, permitting it to react to topic-based messages
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
