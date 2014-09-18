/**
 * Module dependencies
 */

var plural = require('lang-js-plural');
var interpolate = require('lang-js-interpolate');

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
  if (typeof arr === 'string') return interpolate(arr, opts);

  opts = opts || {};

  var fn = lookup(locale);
  if (fn.count !== arr.length) throw new Error('missing required length of plural formats: expected ' + fn.count + '; got ' + arr.length);

  var fns = [];
  for (var i = 0, l = arr.length; i < l; i++) {
    fns.push(interpolate(arr[i], opts));
  }

  var key = opts.pluralKey || 'smart_count';

  return function(params) {
    if (typeof params === 'number') params = convert(params, key);

    var count = parseInt(params[key], 10);
    if (Number.isNaN(count)) throw new Error('expected "' + key + '" to be a number. got "' + (typeof params[key]) + '".');

    return fns[fn(count)](params);
  };
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
  fn = plural[locale.replace(/_/g, '-').split('-')[0]];
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
