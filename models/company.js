"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate, sqlForCoFilter, verifyCoQryParams } = require("../helpers/sql");
// ADDED LINE 7.
const { coFilterJsToSql, CAST } = require("../config.js");
/** Simple Company Class ORM, related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);
    
    const company = companyRes.rows[0];
    if (!company) throw new NotFoundError(`No company: ${handle}`);
    // ADDED LINE 88-98.
    // This extracts relational job data for the handle. 
    const jobsRes = await db.query(
        `SELECT id, title, salary,
          company_handle AS "companyHandle",
          ${CAST}
        FROM jobs WHERE company_handle = $1
        ORDER BY title`,
        [handle]);

    const jobs = jobsRes.rows;

    return { company, jobs };
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }

  // ADDED LINE 156-177.
  static async coFilter(data) {
    // This verifies all qry params are allowed.
    const verifyFilters = verifyCoQryParams(data);
    if (verifyFilters === false) throw new BadRequestError('Invalid filter.');
    // This creates and destructures the qry statements and pg values array.
    // Look in config.js to see the object passed into sqlForCoFilter.
    const { setCols, values } = sqlForCoFilter(
        data,
        coFilterJsToSql
        );
    // This creates the entire query that gets passed into db.query.
    const querySql = `SELECT handle, name, num_employees, description,
                      logo_url FROM companies 
                      WHERE ${setCols} 
                      `;                      
    // This is the actual pg query.
    const result = await db.query(querySql, [...values]);
    const company = result.rows;
    if (company.length === 0) throw new NotFoundError("No companies found.");
    return company;
  }
}


module.exports = Company;
