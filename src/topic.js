'use strict'

import jsonPath from 'jsonpath'
import * as jsonRel from 'json-rel'
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
 * JsonPath (similar to XPath) query topics
 */
export class JsonPath extends Topic {
// export class JsonRelTopic extends Topic {

  /**
   * @param key {String} valid JsonPath query string 
   */
  constructor(key) {
    super(key)
  }

  /**
   * Determines the set / subset of data that matches JsonPath
   *
   * @param data {Object} 
   * @return data set matching JsonPath
   */
  matches(data): Array {
    return jsonPath.query(data, this.key)
    // return jsonRel.$(this.key, data).get()
  }

  /**
   * Determines if data is a valid JsonPath
   *
   * @param data {String}
   * @return true
   */
  static appliesTo(data): boolean {
    // console.log('---- wut', this.key)
    // jsonRel.AbstractRelSpec.identify()
    return !isEmpty(jsonPath.parse(data))
    // return !!jsonRel.which(data)
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
  if (is(data.constructor, String) && JsonPath.appliesTo(data)) {
    return new JsonPath(data)
  }

  return new Topic(data)

  // if (is(data.constructor, String) && JsonRelTopic.appliesTo(data)) {
  //   return new JsonRelTopic(data)
  // }

  // return new Topic(data)
}
