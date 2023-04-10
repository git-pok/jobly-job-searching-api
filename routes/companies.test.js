"use strict";
// ADDED LINE 3.
process.env.NODE_ENV = 'test';
const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
  job1Id,
  job2Id
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */
// ADDED CODE: Adjusted tests for the Part 3 middleware.
describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("ok for logged in users who are admins", async function () {
    const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCompany,
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /companies", function () {
  test("get companies: works for all users", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies:
          [
            {
              handle: "c1",
              name: "C1",
              description: "Desc1",
              numEmployees: 1,
              logoUrl: "http://c1.img",
            },
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img",
            },
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              numEmployees: 3,
              logoUrl: "http://c3.img",
            },
            {
              handle: "c4",
              name: "C4",
              description: "Desc4",
              numEmployees: 4,
              logoUrl: "http://c4.img",
            }
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
        .get("/companies")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

// ADDED LINE 124-196
/************************************** GET /companies? */
describe('/GET /companies?', ()=> {
  test('query with name filter', async ()=> {
    const res = await request(app).get('/companies').query({ name: "c1" });
    
    const co1 = {
      handle: "c1",
      name: "C1",
      description: "Desc1",
      num_employees: 1,
      logo_url: "http://c1.img"
    };
    
    expect(res.body).toEqual( [ co1 ] );
  });

  test('query with name and minEmployees filter', async ()=> {
    const res = await request(app)
      .get('/companies')
      .query({ name: "c", minEmployees: "2" });
    
    const co2 = {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      num_employees: 2,
      logo_url: "http://c2.img",
    };

    const co3 = {
      handle: "c3",
      name: "C3",
      description: "Desc3",
      num_employees: 3,
      logo_url: "http://c3.img",
    };

    const co4 = {
      handle: "c4",
      name: "C4",
      description: "Desc4",
      num_employees: 4,
      logo_url: "http://c4.img",
    }
    
    expect(res.body).toEqual( [ co2, co3, co4 ] );
  });

  test('query with name, minEmployees, and maxEmployees filter', async ()=> {
    const res = await request(app)
      .get('/companies')
      .query({ name: "c", minEmployees: "2", maxEmployees: "2" });
    
    const co2 = {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      num_employees: 2,
      logo_url: "http://c2.img",
    };
    
    expect(res.body).toEqual( [ co2 ] );
  });

  test('404 status code for not found company', async ()=> {
    const res = await request(app).get('/companies').query({ name: "wat" });
    expect(res.statusCode).toBe(404);
  });

  test('400 status code for invalid query', async ()=> {
    const res = await request(app).get('/companies').query({ wrong: "wat" });
    expect(res.statusCode).toBe(400);
  });
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const id = await job1Id();

    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      }, jobs: [
        {
          id,
          companyHandle: "c1",
          title: "Programmer",
          salary: 200000,
          equity: 0
        }
      ]
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const id = await job2Id();

    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }, jobs: [
        {
          id,
          companyHandle: "c2",
          title: "Software Engineer",
          salary: 250000,
          equity: 0.4
        }
      ]
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */
// ADDED CODE: Adjusted tests for the Part 3 middleware.
describe("PATCH /companies/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/companies/nope`)
        .send({
          name: "new nope",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */
// ADDED CODE: Adjusted tests for the Part 3 middleware.
describe("DELETE /companies/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
