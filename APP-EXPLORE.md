# APP EXPLORATION
This document explains my finds and changes.

### AUTHORIZATION
The way this app authorizes is we create a header of authorization. Then we give it a value of Bearer token:
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

We do not put any of the header data in strings either. So when we make a patch request to 'users/:username', with Insomnia, we create a header, then we create our body, then we send the request.

### sqlForPartialUpdate Tests
I tested the function with data, without data, and with no arguments. I commented the code also.

### /companies Query Filter
I added helper functions to sql.js, then I created a class method
in comany.js to call the query filter function, then I called
the class method in /GET /companies route handler, along with the
functions in sql.js that I did not call in the class method for it.

### Jobs Table: Numeric Over Float Column Data Type
Numeric is precise and enforces the exact precision and scale specified. Floats' precison is inexact.

### PG: Numeric Data Type
Numeric data type is more precise than floating. By default, the PostgreSQL backend server returns numeric data types as strings for precision. My theory on why PostgreSQL returns a string for numeric data types is because numeric data types may hold large numbers, and text data types hold an unlimited amount of characters. This string storage allows large numbers to be stored without the chance of large numbers becoming corrupt.

The string that returns is already a string, so pg doesn't parse it. To convert the string to a number, we need to create a custom parser for numeric data types that will return a number.