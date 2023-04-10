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

describe("sqlForPartialUpdate()", function () {
  test("creates object of sql statements and pg values array", async function () {
    const result = sqlForPartialUpdate(data, js);

    expect(result).toEqual({
      setCols: "\"first_name\"=$1, \"last_name\"=$2",
      values
    });
  });

  test("BadRequestError for no keys", async function () {
    try {
      sqlForPartialUpdate({}, js);
    } catch(err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
