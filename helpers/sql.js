const { BadRequestError, ExpressError } = require("../expressError");

// EXPLAINED sqlForPartialUpdate WITH COMMENTS.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Creates keys from query object.
  const keys = Object.keys(dataToUpdate);
  // This throws an error if there is no data. 
  if (keys.length === 0) throw new BadRequestError("No data");
  // This sets the sql statements to their prot. values.
  // It loops over the keys of the query object,
  // and accesses the corresponding sql commands from
  // the qryToSql object; this assures no extra sql commands
  // are added also. Then it uses each index of each key +1
  // to create the pg parameterized values.
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

// ADDED LINE 31-59
function sqlForCoFilter(dataToQuery, qryToSql) {
  const nameProp = dataToQuery.name;
  // If name in query, this wraps its value in %%,
  // to make the postgresql ILIKE expression work.
  if (nameProp) dataToQuery.name = `%${nameProp}%`;
  // This creates an array of keys out of the query object.
  const keys = Object.keys(dataToQuery);
  // This throws an error if there is no data.
  if (keys.length === 0) throw new BadRequestError("No data");
  // This sets the sql statements to their prot. values.
  // It loops over the keys of the query object,
  // and accesses the corresponding sql commands from
  // the qryToSql object; this assures no extra sql commands
  // are added also. Then it uses each index of each key +1
  // to create the pg parameterized values.
  // {name: 'name ILIKE', minEmployees: 'num_employees >'} =>
  // ['name ILIKE=$1', 'num_employees >=$2']
  const cols = keys.map((colName, idx) =>
      `${qryToSql[colName]} $${idx + 1}`,
  );
  // Returns an object with one property set to
  // individual query statements, and another
  // property set to a pg value array.
  // {setCols: 'name ILIKE=$1 AND num_employees >=$2', values: [ 'wat', 300 ]}
  return {
    setCols: cols.join(' AND '),
    values: Object.values(dataToQuery)
  };
}

// ADDED LINE 62-74
// This takes the minEmployees and maxEmployees
// values from the query object and turns them
// into numbers.
// {"name": "wall", "minEmployees": "200"} =>
// {"name": "wall", "minEmployees": 200} 
function strToNum(qryObj) {
  const newObj = {...qryObj}; 
  const maxEmps = newObj.maxEmployees;
  const minEmps = newObj.minEmployees;
  if (maxEmps) newObj.maxEmployees = +maxEmps;
  if (minEmps) newObj.minEmployees = +minEmps;
  return newObj;
}

// ADDED LINE 77-84
// This verifies the minEmployees value is
// never greater than the maxEmployees value. 
function verifyMinMaxEmps(qryObj) {
  const newObj = {...qryObj}; 
  const maxEmps = newObj.maxEmployees;
  const minEmps = newObj.minEmployees;
  if (minEmps > maxEmps) throw new ExpressError("minEmployees cannot be greater than maxEmployees", 400);
}

// ADDED LINE 91-96
// This verfies there are no query parameters that
// our logic doesn't solve for.
// {"name": "wall", "minEmployees": 200} => true
// {"name": "wall", "wrongParam": 200} => false
function verifyQryParams(qryObj) {
  const qryFilters = ['name', 'minEmployees', 'maxEmployees']; 
  const keys = Object.keys(qryObj);
  const verifyFilters = keys.every((val)=> qryFilters.indexOf(val) !== -1); 
  return verifyFilters;
}

// ADDED LINE 103-108
// This verfies there are no query parameters that
// our logic doesn't solve for.
// {"title": "wall", "minSalary": 200} => true
// {"name": "wall", "wrongParam": 200} => false
function verifyJobQryParams(qryObj) {
  const qryFilters = ['title', 'minSalary', 'hasEquity']; 
  const keys = Object.keys(qryObj);
  const verifyFilters = keys.every((val)=> qryFilters.indexOf(val) !== -1);
  return verifyFilters;
}

// ADDED LINE 117-126.
// Gets called in sqlForJobFilter(), line 136.
// This takes the query object and checks for hasEquity.
// If hasEquity equals true, the value becomes zero.
// If hasEquity equals false, the property is deleted.
// { hasEquity: "true" } => { hasEquity: 0 }.
// { hasEquity: "false" } => {}.
function hasEquityFilter(qryObj) {
  if (qryObj.hasEquity) {
    const qryProp = qryObj.hasEquity;
    if (qryProp === 'true') {
      qryObj.hasEquity = 0;
    } if (qryProp === 'false') {
      delete qryObj.hasEquity;
    }
  } 
}

// ADDED LINE 129-160.
function sqlForJobFilter(dataToQuery, qryToSql) {
  const titleProp = dataToQuery.title;
  // If title in query, this wraps its value in %%,
  // to make the postgresql ILIKE expression work.
  if (titleProp) dataToQuery.title = `%${titleProp}%`;
  // This checks for hasEquity and chnages its value.
  // Look at the comments that start on line 14 of this file.
  hasEquityFilter(dataToQuery);
  // This creates an array of keys out of the query object.
  const keys = Object.keys(dataToQuery);
  // This throws an error if there is no data.
  if (keys.length === 0) throw new BadRequestError("No data");
  // This sets the sql statements to their prot. values.
  // It loops over the keys of the query object,
  // and accesses the corresponding sql commands from
  // the qryToSql object; this assures no extra sql commands
  // are added also. Then it uses each index of each key +1
  // to create the pg parameterized values.
  // {title: 'title ILIKE', minSalary: 'salary >='} =>
  // ['title ILIKE=$1', 'minSalary >=$2']
  const cols = keys.map((colName, idx) =>
      `${qryToSql[colName]} $${idx + 1}`,
  );
  // Returns an object with one property set to
  // individual query statements, and another
  // property set to a pg value array.
  // {setCols: 'title ILIKE=$1 AND minSalary >=$2', values: [ 'Programmer', 100000 ]}
  return {
    setCols: cols.join(' AND '),
    values: Object.values(dataToQuery)
  };
}

// ADDED LINE 167-174
// This verfies there are no json parameters that
// our logic doesn't solve for.
// {"title": "prog", "salary": 200} => true
// {"title": "wall", "wrongParam": 200} => false
function verifyCreateJobParams(qryObj) {
  const qryFilters = [
    "title", "salary", "equity", "companyHandle"
  ];
  const keys = Object.keys(qryObj);
  const verifyFilters = keys.every((val)=> qryFilters.indexOf(val) !== -1);
  return verifyFilters;
}

module.exports = {
  sqlForPartialUpdate,
  sqlForCoFilter,
  strToNum,
  verifyMinMaxEmps,
  verifyQryParams,
  verifyJobQryParams,
  sqlForJobFilter,
  verifyCreateJobParams
};
