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
 * @param type A `string` containing the type to normalize
 * @return A `string` with the normalized value, `null` if cannot be normalized
 * @public
 */

export function normalize(type: string): string | null;

/**
 * Stop executions if type is not a `string`, meant for JS users.
 *
 * @param type `any`
 * @return `false`
 * @public
 */

export function normalize(type: any): false;

/**
 * Check if `actual` mime type
 * matches `expected` mime type with
 * wildcard and +suffix support.
 *
 * @param actual The result of normalize (i.e. a `string` or `false`)
 * @param expected What you expect the type to be
 * @return A `boolean` indicating if actual and expected types match
 * @public
 */

export function mimeMatch(actual: string, expected: string): boolean;

/**
 * @param actual If normalize is `false`
 * @param expected What you expect the type to be
 * @return `false`
 * @public
 */

export function mimeMatch(actual: false, expected: string): false;

/**
 * Compare a `value` content-type with `types`.
 * Each `type` can be an extension like `html`,
 * a special shortcut like `multipart` or `urlencoded`,
 * or a mime type.
 *
 * If no types match, `false` is returned.
 * Otherwise, the first `type` that matches is returned.
 *
 * @param value A `string` or `Request` to compare with one or multiple types
 * @param types_ An array of `string` | `string[]` to check if the type from
 * **value** matches with one of these types
 * @return `false` if there is not match or a `string` with the type if a match
 * was found
 * @public
 */

export function typeIs(
  value: string | Request,
  ...types_: string[] | string[][]
): false | string;

/**
 * Check if a request has a request body.
 * A request with a body __must__ either have `transfer-encoding`
 * or `content-length` headers set.
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.3
 *
 * @param req A `Request` object
 * @return `true` if the `Request` has a body, `false` if not
 * @public
 */

export function hasBody(req: Request): boolean;

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
 * @param req A `Request` object
 * @param types_ An array of `string` | `string[]` to check if the type of the
 * **Request**, matches with one of these types
 * @return A `string` with the match type, `null` if the request has no body or
 * `false` if the types doesn't match
 * @public
 */

export default function typeOfRequest(
  req: Request,
  ...types_: string[]
): null | false | string;
