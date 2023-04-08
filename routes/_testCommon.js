"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job.js");
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });
  // ADDED LINE 40-47.
  await Company.create(
    {
      handle: "c4",
      name: "C4",
      numEmployees: 4,
      description: "Desc4",
      logoUrl: "http://c4.img",
    });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  // ADDED LINE 74-103.
  await User.register({
    username: "u4",
    firstName: "U4F",
    lastName: "U4L",
    email: "user4@user.com",
    password: "password4",
    isAdmin: true,
  });
  await Job.create(
    {
      companyHandle: "c1",
      title: "Programmer",
      salary: 200000,
      equity: 0
    });
  await Job.create(
    {
      companyHandle: "c2",
      title: "Software Engineer",
      salary: 250000,
      equity: 0.4
    });
  await Job.create(
    {
      companyHandle: "c3",
      title: "Full Stack Developer",
      salary: 300000,
      equity: 0.8
    });
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
// ADDED LINE 120.
const u4Token = createToken({ username: "u4", isAdmin: true });

// ADDED LINE 123-151.
async function job1Id() {
  const c1Id = await db.query(
    `SELECT id FROM jobs WHERE title = 'Programmer'`
  );

  const [ { id } ] = c1Id.rows;

  return id;
}

async function job2Id() {
  const c2Id = await db.query(
    `SELECT id FROM jobs WHERE title = 'Software Engineer'`
  );

  const [ { id } ] = c2Id.rows;

  return id;
}

async function job3Id() {
  const c3Id = await db.query(
    `SELECT id FROM jobs WHERE title = 'Full Stack Developer'`
  );

  const [ { id } ] = c3Id.rows;

  return id;
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
  job1Id,
  job2Id,
  job3Id
};
