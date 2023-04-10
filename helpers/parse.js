// ADDED ALL LOGIC IN THIS FILE.
const { BadRequestError } = require("../expressError");

// Parses request body for id or companyHandle,
// returns an error if either one is present.
// {id: 1, companyHandle: "hall-davis", title: Engineer} =>
// "Company handle/id is not editable."
function handleOrIdParse(reqBody) {
  const handle = reqBody.companyHandle;
  const id = reqBody.id;

  if (handle || id)
    throw new BadRequestError("Company handle/id is not editable.");
  
  return false;
}


module.exports = {
  handleOrIdParse
};
