// ADDED ALL LOGIC IN THIS FILE.
const types = require('pg').types;

// In jobs table, the equity column is Numeric data type;
// Numeric data is returned as a string.
// parse() parses the string and turns it into a number.
// "1.08" => 1.08
function parse(val) {
  types.setTypeParser(1700, (val)=> Number(val));
}


module.exports = {
  parse
};
