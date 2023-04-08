"use strict";
// CREATED ALL LOGIC IN THIS FILE.
const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");

const { 
  sqlForPartialUpdate, sqlForJobFilter,
  verifyJobQryParams
} = require("../helpers/sql");

const { jobJsToSql, jobFilterJsToSql } = require("../config.js");
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
    const companyRes = await db.query(
      `SELECT handle, name, description,
      num_employees AS "numEmployees",
      logo_url AS "logoUrl"
      FROM companies WHERE handle = $1`,
    [handle]);

    const companyRow = companyRes.rows;
    const [ company ] = companyRow;
    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobsRes = await db.query(
          `SELECT id, title, salary,
          company_handle AS "companyHandle",
          CAST(equity AS DOUBLE PRECISION)
          FROM jobs WHERE company_handle = $1
          ORDER BY title`,
        [handle]);
    
    const jobs = jobsRes.rows;
    // if (!jobs) throw new NotFoundError(`No jobs: ${handle}`);

    const jobResults = { jobs, company };
    return jobResults;
  }

  // /** Update job data with `data`.
  //  *
  //  * This is a "partial update" --- it's fine if data doesn't contain all the
  //  * fields; this only changes provided ones.
  //  *
  //  * Data can include: { title, salary, equity }
  //  *
  //  * Returns { title, salary, equity, companyHandle }
  //  *
  //  * Throws NotFoundError if not found.
  //  */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        jobJsToSql
        );

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job id: ${id}`);

    return job;
  }

  // /** Delete given job from database; returns undefined.
  //  *
  //  * Throws NotFoundError if job not found.
  //  **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]
    );

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

  static async jobFilter(data) {
    // This verifies all qry params are allowed.
    const verifyFilters = verifyJobQryParams(data);
    if (verifyFilters === false) throw new BadRequestError('Invalid filter.');
    // This creates and destructures the qry statements and pg values array.
    // Look in config.js to see the object passed into sqlForJobFilter.
    const { setCols, values } = sqlForJobFilter(
        data,
        jobFilterJsToSql
        );
    // This creates the entire query that gets passed into db.query.
    const querySql = `SELECT id, title, salary, company_handle,
                        CAST(equity AS DOUBLE PRECISION) FROM jobs 
                        WHERE ${setCols} ORDER BY title 
                      `;                      
    // This is the actual pg query.
    const result = await db.query(querySql, [...values]);
    const job = result.rows;
    if (job.length === 0) throw new NotFoundError("No jobs found.");
    return job;
  }
}


module.exports = Job;
