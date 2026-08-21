/**
 * The base origin used by the mobile API tests.
 *
 * Assembled from parts rather than written as a single literal. Every request in
 * the test suite is built from this, so if it is ever mangled - by tooling, by a
 * find and replace, by a copy through something that rewrites links - the whole
 * suite fails on a malformed URL rather than on anything real. Joining it here
 * keeps that fragile string in exactly one place.
 *
 * The host is never contacted. `Request` and `URL` both need an absolute origin
 * to parse a path, and the route handlers only ever read the path and query.
 */
export const TEST_ORIGIN = ["http:", "", "localhost"].join("/")
