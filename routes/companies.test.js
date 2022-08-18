"use strict";

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");


let testCompany;

beforeEach(async function () {
  await db.query(`DELETE FROM companies`);
  let results = await db.query(`
  INSERT INTO companies (code, name, description)
  VALUES ('apple', 'Apple', 'An apple company')
  RETURNING code, name, description`);
  testCompany = results.rows[0]
});

// afterAll(function () {
//   db.end();
// })

describe("GET /companies", function () {
  test("Gets list of companies", async function() {
    const res = await request(app).get(`/companies`);
    expect(res.body).toEqual({
      companies: [{
        code: testCompany.code,
        name: testCompany.name}]})
  })
});

describe("GET /companies/:code", function () {
  test("Get a single company", async function() {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.body).toEqual(
      {company: {
        code : testCompany.code,
        name : testCompany.name,
        description: testCompany.description,
        invoices: []
      }}
    );
  });
});