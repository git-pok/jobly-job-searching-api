const { BadRequestError } = require("../expressError");

// EXPLAINED sqlForPartialUpdate WITH COMMENTS.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // CREATES A VARIABLE OF THE OBJECT'S KEYS
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  // CREATES POSTGRESQL QUERY VALUES
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  // RETURNS THE POSTGRESQL QUERY VALUES JOINED WITH COMMAS
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
