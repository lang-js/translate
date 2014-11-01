/**
 * Module dependencies
 */

var plural = {
  cardinal: require('lang-js-cardinal'),
  ordinal: require('lang-js-ordinal')
};
var interpolate = require('lang-js-interpolate');
var reduce = require('directiv-core-reduce');

/**
 * Expose the translate function
 */

exports = module.exports = translate;

/**
 * Compile a translation function
 *
 * @param {String|Array|Object} cldr
 * @param {String} locale
 * @param {Object?} opts
 * @return {Function}
 */

function translate(cldr, locale, opts) {
  if (typeof cldr === 'string') return augment(interpolate(cldr, opts));

  opts = opts || {};

  var pluralize = lookup(locale, cldr._format || opts.pluralFormat);
  if (Array.isArray(cldr)) cldr = convertArray(cldr, pluralize, opts);

  validate(cldr, pluralize);

  var paramsObj = {};
  var cases = toFunctions(cldr, pluralize, opts, paramsObj);

  var key = cldr._plural_key || opts.pluralKey || 'smart_count';
  var validatePluralKey = typeof opts.validatePluralKey === 'undefined' ? true : opts.validatePluralKey;

  return augment(function(params) {
    if (typeof params === 'number') params = convertSmartCount(params, key);

    var count = parseInt(params[key], 10);
    if (validatePluralKey && isNaN(count)) throw new Error('expected "' + key + '" to be a number. got "' + (typeof params[key]) + '".');

    return (cases[count] || cases[pluralize(count || 0)])(params);
  }, Object.keys(paramsObj));
}

/**
 * Validate a cldr against a pluralize function
 *
 * @param {Object} cldr
 * @param {Function} pluralize
 */

function validate(cldr, pluralize) {
  pluralize.formats.forEach(function(key) {
    if (!cldr[key]) throw new Error('translation object missing required key "' + key + '"');
  });
}

/**
 * Convert a cldr object to an object of functions
 *
 * @param {Object} cldr
 * @param {Function} pluralize
 * @param {Object} opts
 * @param {Object} paramsObj
 * @return {Object}
 */

function toFunctions(cldr, pluralize, opts, paramsObj) {
  return Object.keys(cldr).reduce(function(acc, key) {
    if (key.indexOf('_') === 0) return acc;
    var value = cldr[key];
    if (typeof value !== 'string') return acc;
    var t = acc[key] = interpolate(value, opts);
    merge(paramsObj, t.params);
    return acc;
  }, {});
}

/**
 * Augment translate functions with params reduce functions
 *
 * @param {Function} fn
 * @param {Array} keys
 * @return {Function}
 */

function augment(fn, keys) {
  keys = keys || fn.params || [];
  if (!Array.isArray(keys)) keys = Object.keys(keys);
  fn.params = reduce(keys);
  fn.params.keys = keys;
  return fn;
}

/**
 * Lookup the plural function given a locale
 *
 * @param {String} locale
 * @param {String} format
 * @return {Function}
 */

function lookup(locale, format) {
  if (!locale) throw new Error('missing required "locale" parameter');
  format = format || 'cardinal';
  var p = plural[format];
  if (!p) throw new Error('unsupported plural format "' + format + '"');
  var fn = p[locale];
  if (fn) return fn;
  fn = plural[locale.split(/[\-_]/)[0]];
  if (fn) return fn;

  throw new Error('unsupported locale "' + locale + '"');
}

/**
 * Convert an array input to a CLDR object
 *
 * @param {Array} arr
 * @param {Function} pluralize
 * @param {Object} opts
 * @return {Object}
 */

function convertArray(arr, pluralize, opts) {
  if (arr.length !== pluralize.count) throw new Error('missing required length of plural formats: expected ' + pluralize.count + '; got ' + arr.length);

  return pluralize.formats.reduce(function(acc, key, i) {
    acc[key] = arr[i];
    return acc;
  }, {});
}

/**
 * Convert a number to a smart_count object
 *
 * @param {Number} val
 * @param {String} key
 * @return {Object}
 */

function convertSmartCount(val, key) {
  var obj = {};
  obj[key] = val;
  return obj;
}

/**
 * Merge b into a
 *
 * @param {Object} a
 * @param {Object} b
 */

function merge(a, b) {
  for (var key in b) {
    a[key] = b[key];
  };
}
