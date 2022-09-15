/*!
 * request-type-is
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * Copyright(c) 2022 Josep Galearez
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const typer = require('media-typer');
const mime = require('mime-types');

/**
 * Normalize a type and remove parameters.
 *
 * @param {string | Request} value - A `string` or `Request`
 * with a type to normalize
 * @return A `string` with the normalized value or `Error`
 * if the type cannot be normalized
 * @private
 */

function normalizeType(value) {
  // parse the type
  const type = typer.parse(value);

  // remove the parameters
  type.parameters = undefined;

  // reformat it
  return typer.format(type);
  // flatten arguments of string[]
}

/**
 * This function is a wrapper of the normalizeType function,
 * meant to handle the errors comming form the media-typer instances.
 *
 * @param {string | Request} value - A `string` or `Request` with
 * a type to normalize
 * @return A `string` with the normalized value or `null` if the
 * type cannot be normalized
 * @private
 */

function tryNormalizeType(value) {
  if (!value) {
    return null;
  }

  try {
    return normalizeType(value);
  } catch (err) {
    return null;
  }
}

/**
 * Normalize a mime type.
 * If it's a shorthand, expand it to a valid mime type.
 *
 * In general, you probably want:
 *
 *   const type = is(req, ['urlencoded', 'json', 'multipart']);
 *
 * Then use the appropriate body parsers.
 * These three are the most common request body types
 * and are thus ensured to work.
 *
 * @param {string} type A `string` containing the type to normalize
 * @return A `string` with the normalized value, `null` if
 * cannot be normalized
 * @public
 */

function normalize(type) {
  if (typeof type !== 'string') {
    // invalid type
    return false;
  }

  switch (type) {
    case 'urlencoded':
      return 'application/x-www-form-urlencoded';
    case 'multipart':
      return 'multipart/*';
    default:
  }

  if (type[0] === '+') {
    // "+json" -> "*/*+json" expando
    return `*/*${type}`;
  }

  return type.indexOf('/') === -1 ? mime.lookup(type) : type;
}

/**
 * Check if `actual` mime type
 * matches `expected` mime type with
 * wildcard and +suffix support.
 *
 * @param {string | false} actual The result of normalize (i.e.
 * a `string` or `false`)
 * @param {string} expected What you expect the type to be
 * @return A `boolean` indicating if actual and expected types
 * match
 * @public
 */

function mimeMatch(expected, actual) {
  // invalid type
  if (expected === false) {
    return false;
  }

  // split types
  const actualParts = actual.split('/');
  const expectedParts = expected.split('/');

  // invalid format
  if (actualParts.length !== 2 || expectedParts.length !== 2) {
    return false;
  }

  // validate type
  if (expectedParts[0] !== '*' && expectedParts[0] !== actualParts[0]) {
    return false;
  }

  // validate suffix wildcard
  if (expectedParts[1].substr(0, 2) === '*+') {
    return (
      // prettier-ignore
      expectedParts[1].length <= actualParts[1].length + 1
      && expectedParts[1].substr(1)
      === actualParts[1].substr(1 - expectedParts[1].length)
    );
  }

  // validate subtype
  if (expectedParts[1] !== '*' && expectedParts[1] !== actualParts[1]) {
    return false;
  }

  return true;
}

/**
 * Compare a `value` content-type with `types`.
 * Each `type` can be an extension like `html`,
 * a special shortcut like `multipart` or `urlencoded`,
 * or a mime type.
 *
 * If no types match, `false` is returned.
 * Otherwise, the first `type` that matches is returned.
 *
 * @param {string | Request} value A `string` or `Request` to
 * compare with one or multiple types
 * @param {string[] | string[][]} types_ An array of `string` | `string[]`
 * to check if the type from **value** matches with one of these types
 * @return `false` if there is not match or a `string` with the
 * type if a match was found
 * @public
 */

function typeIs(value, ...types_) {
  let i;

  // remove parameters and normalize
  const val = tryNormalizeType(value);

  // no type or invalid
  if (!val) {
    return false;
  }

  // flatten arguments of string[], make a 2d array into a 1d array
  const types = [].concat(...types_);

  // no types, return the content type
  if (!types || !types.length) {
    return val;
  }

  let type;
  for (i = 0; i < types.length; i += 1) {
    type = types[i];
    if (mimeMatch(normalize(type), val)) {
      return type[0] === '+' || type.indexOf('*') !== -1 ? val : type;
    }
  }

  // no matches
  return false;
}

/**
 * Check if a request has a request body.
 * A request with a body __must__ either have `transfer-encoding`
 * or `content-length` headers set.
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.3
 *
 * @param {Request} req A `Request` object
 * @return `true` if the `Request` has a body, `false` if not
 * @public
 */

function hasBody(req) {
  return (
    // prettier-ignore
    req.headers['transfer-encoding'] !== undefined
    || !Number.isNaN(Number(req.headers['content-length']))
  );
}

/**
 * Check if the incoming request contains the "Content-Type"
 * header field, and it contains any of the give mime `type`s.
 * If there is no request body, `null` is returned.
 * If there is no content type, `false` is returned.
 * Otherwise, it returns the first `type` that matches.
 *
 * Examples:
 *
 *     // With Content-Type: text/html; charset=utf-8
 *     this.is('html'); // => 'html'
 *     this.is('text/html'); // => 'text/html'
 *     this.is('text/*', 'application/json'); // => 'text/html'
 *
 *     // When Content-Type is application/json
 *     this.is('json', 'urlencoded'); // => 'json'
 *     this.is('application/json'); // => 'application/json'
 *     this.is('html', 'application/*'); // => 'application/json'
 *
 *     this.is('html'); // => false
 *
 * @param {Request} req A `Request` object
 * @param {string[] | string[][]} types_ An array of `string` | `string[]`
 * to check if the type of the **Request**, matches with one of these types
 * @return A `string` with the match type, `null` if the request has
 * no body or `false` if the types doesn't match
 * @public
 */

function typeofrequest(req, ...types_) {
  // no body
  if (!hasBody(req)) {
    return null;
  }

  // flatten arguments of string[], make a 2d array into a 1d array
  const types = [].concat(...types_);

  // request content type
  const value = req.headers['content-type'];

  return typeIs(value, types);
}

/**
 * Module exports.
 * @public
 */

module.exports = typeofrequest;
module.exports.is = typeIs;
module.exports.hasBody = hasBody;
module.exports.normalize = normalize;
module.exports.match = mimeMatch;
