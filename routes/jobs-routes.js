/** Routes for jobs. */
// ADDED ALL LOGIC IN THIS FILE.
const jsonschema = require("jsonschema");
const express = require("express");
const { handleOrIdParse } = require('../helpers/parse.js');

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
    const queryObj = req.query;
    const keys = Object.keys(queryObj);
    
    if (keys.length !== 0) {
      const job = await Job.jobFilter(queryObj);
      return res.json(job);
    } else {
      const jobs = await Job.findAll();
      return res.json({ jobs });
    }
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
//  * fields can be: { title, salary, equity }
//  *
//  * Returns { title, salary, equity, companyHandle }
//  *
//  * Authorization required: login
//  */

router.patch("/:title", ensureLoggedInAndAdmin, async function (req, res, next) {
  try {
    const reqBody = req.body;
    const reqParams = req.params.title;
    handleOrIdParse(reqBody);
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