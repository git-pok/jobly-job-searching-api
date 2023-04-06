"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate, sqlForCoFilter, verifyQryParams } = require("../helpers/sql");
// ADDED LINE 7.
const { jobJsToSql } = require("../config.js");
/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
          `SELECT company_handle
           FROM jobs
           WHERE title = $1 AND company_handle = $2`,
        [title, companyHandle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ],
    );

    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT title, salary,
            company_handle AS "companyHandle",
            CAST(equity AS DOUBLE PRECISION)
            FROM jobs
            ORDER BY title`);
    const rows = jobsRes.rows;
    
    return rows;
  }

  // /** Given a company handle, return jobs the company has.
  //  *
  //  * Returns { id, title, salary, equity, companyHandle, company }
  //  *   where company is { name, handle, description, numEmployees, logoUrl }
  //  *
  //  * Throws NotFoundError if not found.
  //  **/

  static async get(handle) {
    const jobsRes = await db.query(
          `SELECT title, salary,
          company_handle AS "companyHandle",
          CAST(equity AS DOUBLE PRECISION)
          FROM jobs WHERE company_handle = $1
          ORDER BY title`,
        [handle]);
    
    const jobs = jobsRes.rows;
    if (!jobs) throw new NotFoundError(`No jobs: ${handle}`);

    const companyRes = await db.query(
          `SELECT handle, name, description,
          num_employees AS "numEmployees",
          logo_url AS "logoUrl"
          FROM companies WHERE handle = $1`,
        [handle]);

    const companyRow = companyRes.rows;
    const [ company ] = companyRow;
    const jobResults = { jobs, company };
    return jobResults;
  }

  // /** Update company data with `data`.
  //  *
  //  * This is a "partial update" --- it's fine if data doesn't contain all the
  //  * fields; this only changes provided ones.
  //  *
  //  * Data can include: { title, salary, equity, companyHandle, company }
  //  *
  //  * Returns { title, salary, equity, companyHandle, company }
  //  *
  //  * Throws NotFoundError if not found.
  //  */

  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        jobJsToSql
        );

    const titleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE title = ${titleVarIdx} 
                      RETURNING title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, title]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  // /** Delete given job from database; returns undefined.
  //  *
  //  * Throws NotFoundError if job not found.
  //  **/

  static async remove(title) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE title = $1
           RETURNING title`,
        [title]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);
  }

  // // ADDED LINE 145-167
  // static async coFilter(data) {
  //   // This verifies all qry params are allowed.
  //   const verifyFilters = verifyQryParams(data);
  //   if (verifyFilters === false) throw new ExpressError('Invalid filter.', 400);
  //   // This creates and destructures the qry statements and pg values array.
  //   // Look in config.js to see the object passed into sqlForCoFilter.
  //   const { setCols, values } = sqlForCoFilter(
  //       data,
  //       coFilterJsToSql
  //       );
  //   // This creates the entire query that gets passed into db.query.
  //   const querySql = `SELECT handle, name, num_employees, description,
  //                     logo_url FROM companies 
  //                     WHERE ${setCols} 
  //                     `;                      
  //   // This is the actual pg query.
  //   const result = await db.query(querySql, [...values]);
  //   const company = result.rows;
  //   if (company.length === 0) throw new ExpressError(`No companies found.`, 404);
  //   return company;
  // }
}


module.exports = Job;
