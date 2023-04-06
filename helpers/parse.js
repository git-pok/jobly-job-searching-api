// ADDED ALL LOGIC IN THIS FILE.
const types = require('pg').types;
const { BadRequestError } = require("../expressError");

function handleOrIdParse(reqBody) {
  const handle = reqBody.companyHandle;
  const id = reqBody.id;

  if (handle || id)
    throw new BadRequestError("Company handle/id is not editable.");
}


module.exports = {
  handleOrIdParse
};
