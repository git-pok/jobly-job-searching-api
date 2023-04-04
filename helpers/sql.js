const { BadRequestError, ExpressError } = require("../expressError");

// EXPLAINED sqlForPartialUpdate WITH COMMENTS.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Creates keys from query string.
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  // This sets the sql statements to their prot. values.
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  // Returns an object with one property set to
  // individual query statements, and another
  // property set to each statement's value.
  // {setCols: '"first_name"=$1, "last_name"=$2', values: [ 'fVIN', 'eve' ]}
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// ADDED LINE 25-46
function sqlForCoFilter(dataToQuery, qryToSql) {
  const nameProp = dataToQuery.name;
  // If name in query, this wraps its value in %%.
  if (nameProp) dataToQuery.name = `%${nameProp}%`;
  // Creates keys from query string.
  const keys = Object.keys(dataToQuery);
  if (keys.length === 0) throw new BadRequestError("No data");
  // This sets the sql statements to their prot. values.
  // {name: 'name ILIKE', minEmployees: 'num_employees >'} =>
  // ['name ILIKE=$1', 'num_employees >=$2']
  const cols = keys.map((colName, idx) =>
      `${qryToSql[colName]} $${idx + 1}`,
  );
  // Returns an object with one property set to
  // individual query statements, and another
  // property set to each statement's value.
  // {setCols: 'name ILIKE=$1 AND 'num_employees >=$2', values: [ 'wat', 300 ]}
  return {
    setCols: cols.join(' AND '),
    values: Object.values(dataToQuery)
  };
}

// ADDED LINE 49-55
function strToNum(qryObj) {
  const newObj = {...qryObj}; 
  const maxEmps = newObj.maxEmployees;
  const minEmps = newObj.minEmployees;
  if (maxEmps) newObj.maxEmployees = +maxEmps;
  if (minEmps) newObj.minEmployees = +minEmps;
  return newObj;
}

// ADDED LINE 59-65
function verifyMinMaxEmps(qryObj) {
  const newObj = {...qryObj}; 
  const maxEmps = newObj.maxEmployees;
  const minEmps = newObj.minEmployees;
  if (minEmps > maxEmps) throw new ExpressError("minEmployees cannot be greater than maxEmployees", 400);
}

// ADDED LINE 67-74
function verifyQryParams(qryObj) {
  const newObj = {...qryObj};
  const qryFilters = ['name', 'minEmployees', 'maxEmployees'];
  const filterSet = new Set(qryFilters); 
  const keys = Object.keys(newObj);
  const verifyFilters = keys.every((val)=> filterSet.has(val)); 
  return verifyFilters;
}

module.exports = {
  sqlForPartialUpdate,
  sqlForCoFilter,
  strToNum,
  verifyMinMaxEmps,
  verifyQryParams
};
