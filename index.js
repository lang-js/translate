/**
 * Module dependencies
 */

var plural = require('lang-js-plural');
var interpolate = require('lang-js-interpolate');
var reduce = require('directiv-core-reduce');

/**
 * Expose the translate function
 */

exports = module.exports = translate;

/**
 * Compile a translation function
 *
 * @param {String|Array} arr
 * @param {String} locale
 * @param {Object?} opts
 * @return {Function}
 */

function translate(arr, locale, opts) {
  if (typeof arr === 'string') return augment(interpolate(arr, opts));

  opts = opts || {};

  var fn = lookup(locale);
  if (fn.count !== arr.length) throw new Error('missing required length of plural formats: expected ' + fn.count + '; got ' + arr.length);

  var fns = [];
  var paramsObj = {};
  for (var i = 0, l = arr.length, t; i < l; i++) {
    t = interpolate(arr[i], opts);
    fns.push(t);
    merge(paramsObj, t.params);
  }

  var key = opts.pluralKey || 'smart_count';
  var validatePluralKey = typeof opts.validatePluralKey === 'undefined' ? true : opts.validatePluralKey;

  return augment(function(params) {
    if (typeof params === 'number') params = convert(params, key);

    var count = parseInt(params[key], 10);
    if (validatePluralKey && isNaN(count)) throw new Error('expected "' + key + '" to be a number. got "' + (typeof params[key]) + '".');

    return fns[fn(count || 0)](params);
  }, Object.keys(paramsObj));
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
 * @return {Function}
 */

function lookup(locale) {
  if (!locale) throw new Error('missing required "locale" parameter');
  var fn = plural[locale];
  if (fn) return fn;
  fn = plural[locale.split(/[\-_]/)[0]];
  if (fn) return fn;

  throw new Error('unsupported locale "' + locale + '"');
}

/**
 * Convert a number to a smart_count object
 *
 * @param {Number} val
 * @param {String} key
 * @return {Object}
 */

function convert(val, key) {
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
