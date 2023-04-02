// CREATED ALL LOGIC IN THIS FILE
"use strict";

const { sqlForPartialUpdate } = require("./sql.js");
const { BadRequestError } = require("../expressError");

/************************************** PATCH /users/:username */

const js = {
  firstName: "first_name",
  lastName: "last_name",
  isAdmin: "is_admin"
}

const data = {
  firstName: "User1F",
  lastName: "User1L"
}

const values = Object.values(data);

describe("PATCH /users/:username", function () {
  test("sqlForPartialUpdate: update user data", async function () {
    const result = sqlForPartialUpdate(data, js);
    expect(result).toEqual({
      setCols: "\"first_name\"=$1, \"last_name\"=$2",
      values
    });
  });

  test("sqlForPartialUpdate: call with no arguments", async function () {
    function noData() {
      sqlForPartialUpdate();
    }
    
    expect(noData).toThrowError();
  });

  test("sqlForPartialUpdate: update with no data keys", async function () {
    function noData() {
      sqlForPartialUpdate({}, js);
    }

    expect(noData).toThrowError(new BadRequestError("No data"));
  });
});
