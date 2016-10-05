import { $,  which   } from 'json-where'
import { is, isEmpty } from './util'

/**
 * Base topic. Performs simple equality comparison of value to topic
 *
 * Utilized in Subscription.matches and (by association) Service.publish
 */
export class Topic {

  /**
   * @param {*} key value to use as comparator when matching topics 
   */
  constructor (key) {
    this.key = key
  }

  /**
   * Determines data that matches the topic key
   *
   * @param {Object} data
   * @return {*} data matching topic key
   */
  matches (data): Array {
    return is(this.key, data) ? [data] : []
  }

  /**
   * Determines if provided data can be used as a topic key
   *
   * @param {Object} data
   * @return {boolean} true
   */
  static appliesTo (data): boolean {
    return true
  }

}

/**
 * JsonWhere (abstraction over JsonPointer, JsonQuery and JsonPath) query topics
 */
export class JsonWhereTopic extends Topic {

  /**
   * @param {string} key valid JsonWhere query string
   */
  constructor (key) {
    super(key)
  }

  /**
   * Determines the set / subset of data that matches JsonWhere
   *
   * @param {Object} data
   * @return {Array<*>} data set matching JsonWhere
   */
  matches (data): Array {
    return $(this.key, data).all()
  }

  /**
   * Determines if data is a valid JsonWhere
   *
   * @param {string} data
   * @return {boolean}
   */
  static appliesTo (data): boolean {
    return !!which(data)
  }

}

/**
 * Performs pseudo-reflection on the provided data (typically String)
 * in order to imply which Topic the data is intended to be
 *
 * Returns a base Topic with simple equality comparison in the case of a mis-match
 *
 * @param {*} data potential topic to identify
 * @return {Topic} identified Topic
 */
export function identify (data): Topic {
  if (is(data.constructor, String) && JsonWhereTopic.appliesTo(data)) {
    return new JsonWhereTopic(data)
  }

  return new Topic(data)
}


export default { Topic, JsonWhereTopic, identify }
