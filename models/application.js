"use strict";
// CREATED ALL LOGIC IN THIS FILE.
const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");

/** Simple Class ORM with related functions for applications. */

class Application {
  // /** Given a job id and username, see if application exists.
  //  *
  //  *
  //  * Throws BadRequestError if found.
  //  **/

  static async appliedAlready(id, username) {
    const aplicRes = await db.query(
      `SELECT job_id, username
        FROM applications
        WHERE job_id = $1 AND username = $2`,
          [id, username]
    );

    const aplic = aplicRes.rows;
    if (aplic.length !== 0) throw new BadRequestError(`Already applied to job id: ${id}.`);
  }
}


module.exports = Application;
