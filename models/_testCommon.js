const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM jobs");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img'),
           ('c4', 'C4', 4, 'Desc4', 'http://c4.img')`);

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);
  
  // ADDED LINE 36-42.
  await db.query(`
  INSERT INTO jobs (title, salary, equity, company_handle)
  VALUES ('Programmer', 200000, 0, 'c1'),
         ('Full Stack Engineer', 170000, 0.8, 'c2'),
         ('Back End Engineer', 250000, 0.8, 'c3')
  `);
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
// ADDED LINE 56-81.
async function job1Id() {
  const c1Id = await db.query(
    `SELECT id FROM jobs WHERE title = 'Programmer'`
  );

  const [ { id } ] = c1Id.rows;

  return id;
}

async function job3Id() {
  const c3Id = await db.query(
    `SELECT id FROM jobs WHERE title = 'Back End Engineer'`
  );

  const [ { id } ] = c3Id.rows;

  return id;
}

async function notFoundJobId() {
  const idsRes = await db.query('SELECT id FROM jobs');
  const [ { id: id1 }, { id: id2 }, { id: id3 } ] = idsRes.rows;
  const nonExisId = id1 + id2 + id3 + 1;
  return nonExisId;
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  job1Id,
  job3Id,
  notFoundJobId
};