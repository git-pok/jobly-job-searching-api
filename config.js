"use strict";

/** Shared config for application; can be required many places. */

require("dotenv").config();
require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";

const PORT = +process.env.PORT || 3001;

// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
      ? "jobly_test"
      : process.env.DATABASE_URL || "jobly";
}

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
//
// WJB: Evaluate in 2021 if this should be increased to 13 for non-test use
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

console.log("Jobly Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR".yellow, BCRYPT_WORK_FACTOR);
console.log("Database:".yellow, getDatabaseUri());
console.log("---");
// ADDED LINE 31-35
// This gets passed into sqlForCoFilter in coFilter,
// company.js, Line 154.
const coFilterJsToSql = {
  name: "name ILIKE",
  minEmployees: "num_employees >=",
  maxEmployees: "num_employees <="
}

// ADDED LINE 42-46.
// This gets passed into sqlForPartialUpdate,
// /models/job.js, Line 113.
const jobJsToSql = {
  title: "title",
  salary: "salary",
  companyHandle: "company_handle",
  equity: "equity"
}

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  coFilterJsToSql,
  jobJsToSql,
  getDatabaseUri
};
