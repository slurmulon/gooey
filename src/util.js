'use strict'

/**
 * More convenient object comparison
 */
export const is = (x, y) => x === y || Object.is(x, y)

/**
 * Determines if an object is falsy or an empty array
 */
export const isEmpty = (x) => !x || Object.keys(x).length === 0

/**
 * Safely merges together N objects (leaves source objects untouched)
 */
export const mix = () => Object.assign({}, ...arguments)

/**
 * Default module export
 */
export default { is, isEmpty, mix }