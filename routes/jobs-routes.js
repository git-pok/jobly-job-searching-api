/** Routes for companies. */
// const db = require('../db.js');
const jsonschema = require("jsonschema");
const express = require("express");
const { handleOrIdParse } = require('../helpers/parse.js');
const { strToNum, verifyMinMaxEmps } = require('../helpers/sql.js');

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureLoggedInAndAdmin } = require("../middleware/auth");
const Job = require("../models/job.js");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

// TEST ROUTE
// router.get("/", async function (req, res, next) {
//   try {
//     console.log("JOB", Job);
//     const resp = await db.query(`
//       SELECT id, title, salary, company_handle,
//       CAST(equity AS DOUBLE PRECISION)
//       FROM jobs ORDER BY equity DESC;
//     `);
//     // return res.json({ msg: "Updating!" });
//     return res.json({ "resp": resp.rows });
//   } catch (err) {
//     return next(err);
//   }
// });

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: login and admin
 */
router.post("/", ensureLoggedInAndAdmin, async function (req, res, next) {
  try {
    const reqBody = req.body; 
    const validator = jsonschema.validate(reqBody, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(reqBody);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    // const query = req.query;
    // verifyMinMaxEmps(query);
    // const queryObj = strToNum(query);
    // const keys = Object.keys(query);
    // if (keys.length !== 0) {
      // const company = await Company.coFilter(queryObj);
      // return res.json(company);
    // } else {
      // const jobs = await Job.findAll();
      // // return res.json({ jobs });
      // return res.json({ msg: "Updating!" });
    // }
    const jobs = await Job.findAll();
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

// /** GET /[handle]  =>  { jobs }
//  *
//  *  Job is [{ title, salary, equity, companyHandle, company }
//  *   where company is { name, handle, description, numEmployees, logoUrl }
//  *
//  * Authorization required: none
//  */

router.get("/:handle", async function (req, res, next) {
  try {
    const reqParams = req.params.handle; 
    const jobs = await Job.get(reqParams);
    return res.json( jobs );
  } catch (err) {
    return next(err);
  }
});

// /** PATCH /[job] { fld1, fld2, ... } => { job }
//  *
//  * Patches job data.
//  *
//  * fields can be: { title, salary, equity, companyHandle, company }
//  *
//  * Returns { title, salary, equity, companyHandle, company }
//  *
//  * Authorization required: login
//  */

router.patch("/:title", ensureLoggedInAndAdmin, async function (req, res, next) {
  try {
    const reqBody = req.body;
    const reqParams = req.params.title;
    handleOrIdParse(reqBody);
    // const handle = reqBody.companyHandle;
    // const id = reqBody.id;

    // if (handle || id)
    //   throw new BadRequestError("Company handle/id is not editable.");

    const validator = jsonschema.validate(reqBody, jobUpdateSchema);

    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
 
    const job = await Job.update(reqParams, reqBody);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

// /** DELETE /[job]  =>  { deleted: job }
//  *
//  * Authorization: login
//  */
router.delete("/:title", ensureLoggedInAndAdmin, async function (req, res, next) {
  try {
    const reqParams = req.params.title;
    await Job.remove(reqParams);
    return res.json({ deleted: reqParams });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
