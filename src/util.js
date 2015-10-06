'use strict'

/**
 * More convenient object comnparison
 */
export const is = (x, y) => x === y || Object.is(x, y)

/**
 * Regex matching URLs
 */
export const url = /(http(?:s)?\:\/\/[a-zA-Z0-9]+(?:(?:\.|\-)[a-zA-Z0-9]+)+(?:\:\d+)?(?:\/[\w\-]+)*(?:\/?|\/\w+\.[a-zA-Z]{2,4}(?:\?[\w]+\=[\w\-]+)?)?(?:\&[\w]+\=[\w\-]+)*)/g
