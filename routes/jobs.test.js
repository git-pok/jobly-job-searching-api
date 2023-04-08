"use strict";
// CREATED ALL LOGIC IN THIS FILE.
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
  job2Id,
  job3Id
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */
describe("POST /jobs", function () {
  const newJob = {
    "companyHandle": "c1",
    "title": "Job Test",
    "salary": 200000,
    "equity": 0.8
  };

  const newJobWrongJsonSch = {
    "companyHandle": "c1",
    "title": "Job Test",
    "salary": "200000",
    "equity": 0.8
  };

  test("create job with logged in admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u4Token}`);

    expect(resp.statusCode).toEqual(201);

    expect(resp.body).toEqual({
      job: {
        "companyHandle": "c1",
        "title": "Job Test",
        "salary": 200000,
        "equity": 0.8
      }
    });
  });

  test("400 status code for no data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 200000,
          equity: 0.5,
        })
        .set("authorization", `Bearer ${u4Token}`);

    expect(resp.statusCode).toEqual(400);
  });

  test("400 status code for invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u4Token}`);

    expect(resp.statusCode).toEqual(400);
  });

  test("400 status code for incorrect json schema", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJobWrongJsonSch
        })
        .set("authorization", `Bearer ${u4Token}`);

    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("get jobs: all users authorized", async function () {
    const resp = await request(app).get("/jobs");

    expect(resp.body).toEqual({
            jobs: [{
              companyHandle: "c3",
              title: "Full Stack Developer",
              salary: 300000,
              equity: 0.8
            },
            {
              companyHandle: "c1",
              title: "Programmer",
              salary: 200000,
              equity: 0
            },
            {
              companyHandle: "c2",
              title: "Software Engineer",
              salary: 250000,
              equity: 0.4
            }
            ]
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")

    expect(resp.statusCode).toEqual(500);
  });
});

// /************************************** GET /jobs? */
describe('/GET /jobs?', ()=> {
  test('Query jobs with title filter', async ()=> {
    const res = await request(app).get('/jobs')
        .query({ title: "Programmer" });
    
    const id = await job1Id();

    const job = [{
      id,
      companyHandle: "c1",
      title: "Programmer",
      salary: 200000,
      equity: 0
    }];
    
    expect(res.body).toEqual( job );
  });

  test('Query jobs with minSalary and hasEquity filter', async ()=> {
    const res = await request(app).
        get('/jobs').
        query({ minSalary: 250000, hasEquity: "true" });
    
    const id2 = await job2Id();
    const id3 = await job3Id();

    const jobs = [{
      id: id3,
      companyHandle: "c3",
      title: "Full Stack Developer",
      salary: 300000,
      equity: 0.8
    },
    {
      id: id2,
      companyHandle: "c2",
      title: "Software Engineer",
      salary: 250000,
      equity: 0.4
    }];
    
    expect(res.body).toEqual( jobs );
  });

  test('Query with title, minSalary, and hasEquity filter', async ()=> {
    const res = await request(app).get('/jobs')
        .query({ title: "Programmer", minSalary: 170000, hasEquity: "false" });
    
    const id = await job1Id();

    const jobs = {
      id,
      companyHandle: "c1",
      title: "Programmer",
      salary: 200000,
      equity: 0
    };
    
    expect(res.body).toEqual([ jobs ]);
  });

  test('404 status code for no jobs found', async ()=> {
    const res = await request(app).get('/jobs').
        query({ title: "Coder" });

    expect(res.statusCode).toBe(404);
  });

  test('400 status code for invalid query', async ()=> {
    const res = await request(app).
        get('/jobs').query({ wrong: "wat" });

    expect(res.statusCode).toBe(400);
  });
});

// /************************************** GET /jobs/:handle */

describe("GET /jobs/:handle", function () {
  test("get jobs for company: works for all users", async function () {
    const resp = await request(app).get(`/jobs/c1`);

    const id = await job1Id();

    const jobs = {
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      jobs: [{
        id,
        companyHandle: "c1",
        title: "Programmer",
        salary: 200000,
        equity: 0
    }]
  };

    expect(resp.body).toEqual( jobs );
  });

  test("empty jobs array for company w/o jobs", async function () {
    const resp = await request(app).get(`/jobs/c4`);

    expect(resp.body).toEqual({
      company: {
        handle: "c4",
        name: "C4",
        description: "Desc4",
        numEmployees: 4,
        logoUrl: "http://c4.img",
      }, jobs: []
    });
  });

  test("404 status code for no such company", async function () {
    const resp = await request(app).get(`/jobs/wat`);
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** PATCH /jobs/:id */
describe("PATCH /jobs/:id", function () {
  test("update a job: works for logged in admins", async function () {
    const id = await job1Id();

    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "Software Programmer",
        })
        .set("authorization", `Bearer ${u4Token}`);

    expect(resp.body).toEqual({
      job: {
        companyHandle: "c1",
        title: "Software Programmer",
        salary: 200000,
        equity: 0
      },
    });
  });

  test("401 unatuhorized status code for not logged in admin", async function () {
    const id = await job1Id();

    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "C1-new",
        });

    expect(resp.statusCode).toEqual(401);
  });

  test("404 status code for no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/203`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u4Token}`);

    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** DELETE /jobs/:id */
describe("DELETE /jobs/:id", function () {
  test("delete job: works for logged in admins", async function () {
    const id = await job1Id();

    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${u4Token}`);

    expect(resp.body).toEqual({ deleted: `${id}` });
  });

  test("401 unauthorized status code for not logged in admins", async function () {
    const id = await job1Id();

    const resp = await request(app)
        .delete(`/jobs/${id}`);
    
    expect(resp.statusCode).toEqual(401);
  });

  test("404 status code for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/20`)
        .set("authorization", `Bearer ${u4Token}`);

    expect(resp.statusCode).toEqual(404);
  });
});
