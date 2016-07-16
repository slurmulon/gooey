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
 * Object.entries "polyfill"
 */
export const entries = (obj) => Object.keys(obj).map((key) => [key, obj[key]])

/**
 * Object.values "polyfill"
 */
export const values = (obj) => Object.keys(obj).map((key) => obj[key])


export default { is, isEmpty, mix, entries, values }
