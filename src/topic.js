'use strict'

import * as jsonWhere from 'json-where'
import {is, isEmpty} from './util'

/**
 * Base topic. Performs simple equality comparison of value to topic
 *
 * Utilized in Subscription.matches and (by association) Service.publish
 */
export class Topic {

  /**
   * @param key {Object} value to use as comparator when matching topics 
   */
  constructor(key) {
    this.key = key
  }

  /**
   * Determines data that matches the topic key
   *
   * @param data {Object} 
   * @return data matching topic key
   */
  matches(data): Array {
    return is(this.key, data) ? [data] : []
  }
  
  /**
   * Determines if provided data can be used as a topic key
   *
   * @param data {Object}
   * @return true
   */
  static appliesTo(data): boolean {
    return true
  }

}

/**
 * JsonRel (abstraction over JsonPointer, JsonQuery and JsonPath) query topics
 */
export class JsonRelTopic extends Topic {

  /**
   * @param key {String} valid JsonRel query string
   */
  constructor(key) {
    super(key)
  }

  /**
   * Determines the set / subset of data that matches JsonRel
   *
   * @param data {Object} 
   * @return data set matching JsonRel
   */
  matches(data): Array {
    return jsonWhere.$(this.key, data).all()
  }

  /**
   * Determines if data is a valid JsonRel
   *
   * @param data {String}
   * @return true
   */
  static appliesTo(data): boolean {
    return !!jsonWhere.which(data)
  }

}

/**
 * Performs pseudo-reflection on the provided data (typically String)
 * in order to imply which Topic the data is intended to be
 * 
 * Returns a base Topic with simple equality comparison in the case of a mis-match
 *
 * @param data potential topic to identify
 * @return identified Topic
 */
export function identify(data): Topic {
  if (is(data.constructor, String) && JsonRelTopic.appliesTo(data)) {
    return new JsonRelTopic(data)
  }

  return new Topic(data)
}


export default { Topic, JsonRelTopic, identify }
