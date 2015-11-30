/**
 * Module dependencies
 */

var plural = {
  cardinal: require('lang-js-cardinal'),
  ordinal: require('lang-js-ordinal')
};
var number = require('lang-js-number');
var interpolate = require('lang-js-interpolate');
var reduce = require('directiv-core-reduce');

/**
 * Expose the translate function
 */

module.exports = translate;

/**
 * Expose the number formatting function
 */

translate.number = function(locale, opts) {
  opts = opts || {};
  format = opts.style || 'decimal';
  return lookup(locale, format, number);
};

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

  var pluralize = lookup(locale, cldr._format || opts.pluralFormat, plural);
  if (Array.isArray(cldr)) cldr = convertArray(cldr, pluralize, opts);

  validate(cldr, pluralize);

  var paramsObj = {};
  var cases = toFunctions(cldr, pluralize, opts, paramsObj);
  var paramsKeys = Object.keys(paramsObj);

  var key = cldr._plural_key ||
            opts.pluralKey ||
            discoverKey(paramsKeys,
                        opts.discoverableKeys || {'smart_count':1, 'count':1, 'length':1, 'items':1, 'total':1},
                        opts.defaultPluralKey || 'smart_count');

  var validatePluralKey = typeof opts.validatePluralKey === 'undefined' ? true : opts.validatePluralKey;
  var silentValidation = !!opts.validatePluralSilent;
  var decimal = number.decimal[locale] || number.decimal.en;

  return augment(function(params) {
    if (typeof params === 'number') params = convertSmartCount(params, key);

    var count = parseInt(params[key], 10);
    if (validatePluralKey && isNaN(count)) {
      if (silentValidation) return [];
      throw new Error('expected "' + key + '" to be a number. got "' + (typeof params[key]) + '".');
    }

    if (opts.toLocaleString !== false) params = formatNumbers(params, decimal);

    return (cases[count] || cases[pluralize(count || 0)])(params);
  }, paramsKeys);
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
 * Auto-discover the plural key
 *
 * @param {Array} keys
 * @param {Object} discoverableKeys
 * @param {String} defaultKey
 * @return {String}
 */

function discoverKey(arr, discoverableKeys, defaultKey) {
  if (arr.length === 0) return defaultKey;
  if (arr.length === 1) return arr[0];
  for (var i = 0; i < arr.length; i++) {
    if (discoverableKeys[arr[i]]) return arr[i];
  }
  return defaultKey;
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

function lookup(locale, format, obj) {
  if (!locale) throw new Error('missing required "locale" parameter');
  locale = locale.toLowerCase().replace('-', '_');
  format = format || 'cardinal';
  var p = obj[format];
  if (!p) throw new Error('unsupported format "' + format + '"');
  var fn = p[locale] || p[locale.split('_')[0]];
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
 * Format numbers with lang-js-number
 */

function formatNumbers(prevParams, decimal) {
  var params = {}, value;
  for (var k in prevParams) {
    value = prevParams[k];
    params[k] = typeof value === 'number' ? decimal(value) : value;
  }
  return params;
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
