'use strict'

/**
 * More convenient object comnparison
 */
export const is = (x, y) => x === y || Object.is(x, y)

/**
 * Safely merges together N objects (leaves source objects untouched)
 */
export const mix = () => Object.assign({}, ...arguments)
