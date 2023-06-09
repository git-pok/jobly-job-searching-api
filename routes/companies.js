"use strict";

/** Routes for companies. */
const jsonschema = require("jsonschema");
const express = require("express");
const { strToNum, verifyMinMaxEmps } = require('../helpers/sql.js');

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureLoggedInAndAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: logged in and admin.
 */
// ADDED ensureLoggedInAndAdmin IN LINE 26.
router.post("/", ensureLoggedInAndAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none.
 */

router.get("/", async function (req, res, next) {
  try {
    // ADDED LINE 55-62.
    const query = req.query;
    verifyMinMaxEmps(query);
    const queryObj = strToNum(query);
    const keys = Object.keys(query);
    if (keys.length !== 0) {
      const company = await Company.coFilter(queryObj);
      return res.json(company);
    } else {
      const companies = await Company.findAll();
      return res.json({ companies });
    }
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */
// CHANGED LINE 84.
// I returned company instead of { company },
// company is already structured in an object.
router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json( company );
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: logged in and admin.
 */

// ADDED ensureLoggedInAndAdmin IN LINE 102.
router.patch("/:handle", ensureLoggedInAndAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: logged in and admin.
 */

// ADDED ensureLoggedInAndAdmin IN LINE 123.
router.delete("/:handle", ensureLoggedInAndAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
