"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
      // console.log('AUTH TOKEN', res.locals.user, 'HEADER', authHeader, "IS ADMIN", res.locals.user.isAdmin);
    }
    return next();
  } catch (err) {
    return next();
  }
}

// ADDED LINE 33-48.
/** Middleware to ensure user is logged in and an admin.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedInAndAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    const admin = user ? res.locals.user.isAdmin : false;
    if (!user) throw new UnauthorizedError();
    else if (user && !admin) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

// ADDED LINE 51-69.
/** Middleware to ensure user is logged in and an admin or current user.
 *
 * If not, raises Unauthorized.
 */

function ensureCurrUserOrAdmin(req, res, next) {
  try {
    const userParams = req.params.username;
    const resUserObj = res.locals.user;
    const user = resUserObj ? res.locals.user.username : false;
    console.log("USER", user);
    const isCurrUser = userParams === user;
    const admin = user ? res.locals.user.isAdmin : false;
    if (!user) throw new UnauthorizedError();
    else if (!isCurrUser && !admin) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureLoggedInAndAdmin,
  ensureCurrUserOrAdmin
};
