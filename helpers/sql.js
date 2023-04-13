const { BadRequestError, ExpressError } = require("../expressError");

// EXPLAINED sqlForPartialUpdate WITH COMMENTS.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Takes keys from query object and makes an array of them.
  // { numEmployees: 3, logoUrl: "ex.com"} =>
  // [numEmployees, logoUrl].
  const keys = Object.keys(dataToUpdate);
  // This throws an error if there is no data in keys. 
  if (keys.length === 0) throw new BadRequestError("No data");
  // This sets sql statements to their parameterized values.
  // It loops over keys,
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
  // property set to an array of each statement's value.
  // {setCols: '"first_name"=$1, "last_name"=$2', values: [ 'fVIN', 'eve' ]}
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// ADDED LINE 33-65.
// This creates the sql statments and pg values array
// for the Company filter query string.
// { name: "wat", minEmployees: 300 } =>
// {setCols: 'name ILIKE=$1 AND num_employees >=$2', values: [ 'wat', 300 ]}
function sqlForCoFilter(dataToQuery, qryToSql) {
  const nameProp = dataToQuery.name;
  // If name in query, this wraps its value in %%,
  // to make the postgresql ILIKE expression work.
  if (nameProp) dataToQuery.name = `%${nameProp}%`;
  // This creates an array of keys out of the query object.
  const keys = Object.keys(dataToQuery);
  // This throws an error if there is no data.
  if (keys.length === 0) throw new BadRequestError("No data");
  // This sets the sql statements to their parameterized values.
  // It loops over keys,
  // and accesses the corresponding sql commands from
  // the qryToSql object; this assures no extra sql commands
  // are added also. Then it uses each index of each key +1
  // to create the pg parameterized values.
  // {name: 'name ILIKE', minEmployees: 'num_employees >'} =>
  // ['name ILIKE=$1', 'num_employees >=$2']
  const cols = keys.map((colName, idx) =>
      `${qryToSql[colName]} $${idx + 1}`,
  );
  // This returns an object with one property set to
  // individual query statements, and another
  // property set to a pg value array.
  // {setCols: 'name ILIKE=$1 AND num_employees >=$2', values: [ 'wat', 300 ]}
  return {
    setCols: cols.join(' AND '),
    values: Object.values(dataToQuery)
  };
}

// ADDED LINE 73-80.
// This takes the minEmployees and maxEmployees
// values from the query object and turns them
// into numbers.
// {"name": "wall", "minEmployees": "200"} =>
// {"name": "wall", "minEmployees": 200} 
function strToNum(qryObj) {
  // const newObj = {...qryObj}; 
  const maxEmps = qryObj.maxEmployees;
  const minEmps = qryObj.minEmployees;
  if (maxEmps) qryObj.maxEmployees = +maxEmps;
  if (minEmps) qryObj.minEmployees = +minEmps;
  return qryObj;
}

// ADDED LINE 87-92.
// This throws an error if minEmployees value is
// greater than the maxEmployees value.
// { minEmployees: 600, maxEmployees: 500,} =>
// "minEmployees cannot be greater than maxEmployees".
function verifyMinMaxEmps(qryObj) {
  // const newObj = {...qryObj}; 
  const maxEmps = qryObj.maxEmployees;
  const minEmps = qryObj.minEmployees;
  if (minEmps > maxEmps) throw new ExpressError("minEmployees cannot be greater than maxEmployees", 400);
}

// ADDED LINE 99-104.
// This verfies there are no query parameters that
// our Company filter feature logic doesn't solve for.
// {"name": "wall", "minEmployees": 200} => true
// {"name": "wall", "wrongParam": 200} => false
function verifyCoQryParams(qryObj) {
  const qryFilters = ['name', 'minEmployees', 'maxEmployees']; 
  const keys = Object.keys(qryObj);
  const verifyFilters = keys.every((val)=> qryFilters.indexOf(val) !== -1); 
  return verifyFilters;
}

// ADDED LINE 111-116.
// This verfies there are no query parameters that
// our Job filter feature logic doesn't solve for.
// {"title": "wall", "minSalary": 200} => true
// {"name": "wall", "wrongParam": 200} => false
function verifyJobQryParams(qryObj) {
  const qryFilters = ['title', 'minSalary', 'hasEquity']; 
  const keys = Object.keys(qryObj);
  const verifyFilters = keys.every((val)=> qryFilters.indexOf(val) !== -1);
  return verifyFilters;
}

// ADDED LINE 125-135.
// Gets called in sqlForJobFilter().
// This takes the query object and checks for hasEquity.
// If hasEquity equals true, the value becomes zero.
// If hasEquity equals false, the property is deleted.
// { hasEquity: "true" } => { hasEquity: 0 }.
// { hasEquity: "false" } => {}.
function hasEquityFilter(qryObj) {
  if (qryObj.hasEquity) {
    // This normalizes the query string value.
    const qryProp = qryObj.hasEquity.replaceAll(' ', '').toLowerCase();
    if (qryProp === 'true') {
      qryObj.hasEquity = 0;
    } else if (qryProp === 'false') {
      delete qryObj.hasEquity;
    }
  } 
}

// ADDED LINE 142-173.
// This creates the sql statments and pg values array
// for the Job filter query string.
// { title: "Programmer", minSalaray: 200000 } =>
// {setCols: 'title ILIKE=$1 AND minSalary >=$2', values: [ 'Programmer', 100000 ]}
function sqlForJobFilter(dataToQuery, qryToSql) {
  const titleProp = dataToQuery.title;
  // If title in query, this wraps its value in %%,
  // to make the postgresql ILIKE expression work.
  if (titleProp) dataToQuery.title = `%${titleProp}%`;
  // This checks for hasEquity and chnages its value.
  // Look at the comments that start on line 125 of this file.
  hasEquityFilter(dataToQuery);
  // This creates an array of keys out of the query object.
  const keys = Object.keys(dataToQuery);
  // This throws an error if there is no data.
  if (keys.length === 0) throw new BadRequestError("No data");
  // This sets the sql statements to their parameterized values.
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

// ADDED LINE 180-188.
// This verfies there are no json body properties that
// our Job.create() logic doesn't solve for, in jobs-routes.js.
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

// ADDED LINE 200-230.
// This accepts an object of data to be queried for
// and an object of sql commands, and returns an object
// that has sql insert statements, sql insert values
// of pg values, and values. It gets called in /models/user.js
// (
//  { username: 'Bowser', id: 206 },
//  { username: 'username', id: 'job_id' }
// ) => 
// {setCols: (username, id), pgValues: ($1, $2), valuesArr: [Bowser, 206]}
function sqlForJobInsert(dataToUpdate, jsToSql) {
  // This throws an error if there is no data. 
  if (!dataToUpdate || !jsToSql) throw new BadRequestError("No data");
  // Creates array of keys from query object.
  const keys = Object.keys(dataToUpdate);
  // This creates the insert sql columns.
  // It loops over the keys of the query object,
  // and accesses the corresponding sql values from
  // the jsToSql object; this assures no extra sql commands
  // are added also.
  // {username: 'Aliya', id: 32} => [username, id]
  const cols = keys.map((colName, idx) =>
      `${jsToSql[colName]}`,
  );

  // This creates the pg values for the insert query.
  // {username: 'Aliya', id: 32} => [$1, $2] 
  const vals = keys.map((colName, idx) =>
      `$${idx + 1}`
  );
  // Returns an object with setCols set to an
  // insert sql column statement, pgValues
  // set to pg values for the sql insert values,
  // and valuesArr set to each column's value.
  // {setCols: (username, id), pgValues: ($1, $2), valuesArr [bowser, 206]}
  return {
    setCols: `(${cols.join(", ")})`,
    pgValues: `(${vals.join(", ")})`,
    valuesArr: Object.values(dataToUpdate),
  };
}


module.exports = {
  sqlForPartialUpdate,
  sqlForCoFilter,
  strToNum,
  verifyMinMaxEmps,
  verifyCoQryParams,
  verifyJobQryParams,
  sqlForJobFilter,
  verifyCreateJobParams,
  sqlForJobInsert
};
