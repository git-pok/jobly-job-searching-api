"use strict";

const Job = require("./job.js");
const Application = require("./application.js");
const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate, sqlForJobInsert } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError
} = require("../expressError");

const { BCRYPT_WORK_FACTOR, jobApplyJsToSql, userUpdateJsToSql } = require("../config.js");

/** Simple Class ORM, related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin, jobs: [] }, ...]
   **/

  static async findAll() {
    // ADDED LINE 108-162.
    const joinQuery = await db.query(
      `SELECT u.username,
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          u.email,
          u.is_admin AS "isAdmin",
          a.job_id AS "jobId"
          FROM users u
          FULL JOIN applications a ON u.username = a.username
          ORDER BY u.username
      `
    );

    const joinRows = joinQuery.rows;
    const parsedUsernames = [];
    const joinDataMap = new Map();
    // This loops over join data and creates a
    // Map of objects. Each object is for a user,
    // and contains data from the join.
    // If theres duplicate data, the logic
    // adds the jobId data to the user's object,
    // instead of the jobId and duplicated data.
    // [{ username: "fvin", email: "fv@mail.com", jobId: 1},
    // { username: "fvin", email: "fv@mail.com", jobId: 2}] =>
    // { username: "fvin", email: "fv@mail.com", jobs: [1, 2]}.
    for (let data of joinRows) {
      // If the username doesn't exist in parsedUsernames,
      // push it to it, and make a user object.
      if (parsedUsernames.indexOf(data.username) === -1) {

        parsedUsernames.push(data.username);

        const objFromData = {
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          isAdmin: data.isAdmin,
          jobs: [ data.jobId ]
        }
        // Set the user object in joinDataMap, set to
        // a property with the name of the username.
        joinDataMap.set(data.username, objFromData);
        // If the username of the join data object
        // exists in parsedUsernames, push the jobId data
        // to its matching Map object's property, jobs.
      } else if (parsedUsernames.indexOf(data.username) !== -1) {
        joinDataMap.get(data.username).jobs.push(data.jobId);
      }
    }
    // Clear parsedUsernames.
    parsedUsernames.length = 0;
    const users = Object.fromEntries(joinDataMap);
    return users;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  // ADDED LINE 188-198.
  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username]
    );

    const user = userRes.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
    // ADDED LINE 188-198.
    const jobsRes = await db.query(
      `SELECT a.job_id AS "jobId"
       FROM users u
       JOIN applications a ON u.username = a.username
       WHERE a.username = $1`,
        [username],
    );

    const appRows = jobsRes.rows;
    const jobs = appRows.map((obj)=> obj.jobId);
    return { user, jobs };
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }
    // ADDED userUpdateJsToSql LINE 225.
    const { setCols, values } = sqlForPartialUpdate(
        data,
        userUpdateJsToSql
    );

    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];
  
    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** Given a username and job id, apply to a job.
   *
   * Returns { job id }
   *
   * Throws NotFoundError if user or job not found.
   **/
  // ADDED LINE 269-292.
  static async jobApply(reqParams, reqBody) {
    if (!reqParams || !reqBody) throw new BadRequestError("Data missing.");
    const reqUsername = reqParams.username;
    const reqId = reqParams.id;
    await User.get(reqUsername);
    await Job.getById(reqId);
    await Application.appliedAlready(reqId, reqUsername);

    const { setCols, pgValues, valuesArr } = sqlForJobInsert(
      reqBody,
      jobApplyJsToSql
    );

    const sqlQuery = `
      INSERT INTO applications
      ${setCols} VALUES ${pgValues}
      RETURNING job_id
    `;

    const result = await db.query(sqlQuery, [...valuesArr]);
    const id = result.rows[0].job_id;

    return id;
  }
}


module.exports = User;
