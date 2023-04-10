"use strict";

// ADDED ALL LOGIC IN THIS FILE.

process.env.NODE_ENV = 'test';

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  job1Id,
  job3Id,
  notFoundJobId
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** Job.create() */

describe("Job.create()", function () {
  const newJob = {
    companyHandle: "c1",
    title: "Job Test",
    salary: 200000,
    equity: 0.8
  };

  test("create a job", async ()=> {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'Job Test'`
    );

    expect(result.rows).toEqual([
      {
        title: "Job Test",
        salary: 200000,
        equity: "0.8",
        company_handle: "c1"
      },
    ]);
  });

  test("BadRequestError for creating duplicate job", async ()=> {
      try {
        await Job.create(newJob);
        await Job.create(newJob);
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
  });
});

/************************************** Job.findAll() */

describe("Job.findAll()", function () {
  test("find all jobs", async ()=> {
    let jobs = await Job.findAll();

    expect(jobs).toEqual([
      {
        companyHandle: "c3",
        title: "Back End Engineer",
        salary: 250000,
        equity: 0.8
      },
      {
        companyHandle: "c2",
        title: "Full Stack Engineer",
        salary: 170000,
        equity: 0.8
      },
      {
        companyHandle: "c1",
        title: "Programmer",
        salary: 200000,
        equity: 0
      }
    ]);
  });
});

// /************************************** Job.get() */

describe("Job.get()", function () {
  test("find jobs for a company", async ()=> {
    const id = await job1Id();

    let job = await Job.get("c1");

    expect(job).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      }, jobs: [{
        id, 
        companyHandle: "c1",
        title: "Programmer",
        salary: 200000,
        equity: 0
      }]
    });
  });

  test("NotFound error for not found company", async ()=> {
    try {
      await Job.get("c7");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** Job.getById() */

describe("Job.getById()", function () {
  test("find job", async ()=> {
    const id = await job1Id();

    let job = await Job.getById(id);

    expect(job).toEqual({
        job: [{
          id, 
          companyHandle: "c1",
          title: "Programmer",
          salary: 200000,
          equity: 0
      }]
    });
  });

  test("NotFoundError for not found job", async ()=> {
    try {
      const id = await notFoundJobId();
      await Job.getById(id);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** Job.update() */

describe("Job.update()", function () {
  const updateData = {
    title: "Software Programmer",
    salary: 250000
  };

  test("update a job", async ()=> {
    const id = await job1Id();

    let job = await Job.update(id, updateData);

    expect(job).toEqual({
      companyHandle: "c1",
      title: "Software Programmer",
      salary: 250000,
      equity: 0
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE id = $1`, [id]
    );

    expect(result.rows).toEqual([{
      company_handle: "c1",
      title: "Software Programmer",
      salary: 250000,
      equity: "0"
    }]);
  });

  test("update a job: null fields", async ()=> {
    const id = await job1Id();

    const updateDataSetNulls = {
      title: "Programmer",
      salary: null
    };

    const job = await Job.update(id, updateDataSetNulls);

    expect(job).toEqual({
      companyHandle: "c1",
      title: "Programmer",
      salary: null,
      equity: 0
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE id = $1`, [id]
    );

    expect(result.rows).toEqual([{
      company_handle: "c1",
      title: "Programmer",
      salary: null,
      equity: "0"
    }]);
  });

  test("NotFoundError for a non existing job", async ()=> {
    try {
      const id = await notFoundJobId();
      await Job.update(id, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("BadRequestError for updating job with no data", async ()=> {
    const id = await job1Id();

    try {
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** Job.remove() */

describe("Job.remove()", function () {
  test("delete a job", async ()=> {
    const id = await job1Id();
    await Job.remove(id);

    const res = await db.query(
        `SELECT company_handle FROM jobs WHERE id=$1`,
        [id]
    );

    expect(res.rows.length).toEqual(0);
  });

  test("BadRequestError for removing a non existing job", async ()=> {
    try {
      const id = await notFoundJobId();
      await Job.remove(id);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** Job.jobFilter() */
describe('Job.jobFilter()', ()=> {
  test('query with one filter', async ()=> {
    const id = await job1Id();

    const resData = [{  
      id,  
      companyHandle: "c1",
      title: "Programmer",
      salary: 200000,
      equity: 0
    }];

    const data = { "title": "Programmer" };
    const res = await Job.jobFilter(data);
    expect(res).toEqual(resData);
  });

  test('query with two filters', async ()=> {
    const id = await job3Id();
    const data = { "minSalary": "200000", "hasEquity": "true" };
    const res = await Job.jobFilter(data);

    const resData = [
      {
        id,  
        companyHandle: "c3",
        title: "Back End Engineer",
        salary: 250000,
        equity: 0.8
      }
    ];
    
    expect(res).toEqual(resData);
  });

  test('query with three filters', async ()=> {
    const id = await job3Id();
    const data = {
      "minSalary": "200000",
      "hasEquity": "true",
      "title": "Back End Engineer"
    };
    
    const res = await Job.jobFilter(data);

    const resData = [
      {
        id,  
        companyHandle: "c3",
        title: "Back End Engineer",
        salary: 250000,
        equity: 0.8
      }
    ];
    
    expect(res).toEqual(resData);
  });

  test('NotFoundError for no results', async ()=> {
    try {
      const data = {
        "minSalary": "200000",
        "hasEquity": "true",
        "title": "Full Stack Engineer"
      };

      await Job.jobFilter(data);
      fail();
    } catch(err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test('BadRequestError for invalid filter', async ()=> {
    try {
      const data = { "wrong": "wat" };
      await Job.jobFilter(data);
      fail();
    } catch(err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});