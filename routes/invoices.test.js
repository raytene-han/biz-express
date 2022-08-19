"use strict";

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async function () {
  await db.query(`DELETE FROM invoices`);
  await db.query(`DELETE FROM companies`);
  let compRes = await db.query(`
  INSERT INTO companies (code, name, description)
  VALUES ('apple', 'Apple', 'An apple company')
  RETURNING code, name, description`);
  testCompany = compRes.rows[0];
  let results = await db.query(`
  INSERT INTO invoices (comp_code, amt)
  VALUES ('apple', '100')
  RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoice = results.rows[0];
});

afterAll(async function () {
  await db.end();
})

describe("GET /invoices", function () {
  test("Gets list of invoices", async function() {
    const res = await request(app).get(`/invoices`);
    expect(res.body).toEqual({
      invoices: [{
        id: testInvoice.id,
        comp_code: testInvoice.comp_code}]})
  })
});

describe("GET /invoices/:code", function () {
  test("Get a single company", async function() {
    const res = await request(app).get(`/invoices/${testCompany.code}`);
    expect(res.body).toEqual(
      {company: {
        code : testCompany.code,
        name : testCompany.name,
        description: testCompany.description,
        invoices: []
      }}
    );
  });

  test("Get a single company with invalid code", async function() {
    const res = await request(app).get(`/invoices/hello`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(
      {	"error": {
        "message": "Not Found",
        "status": 404
      }}
    );
  });
});

describe("POST /invoices", function () {
  test("Create a new invoice", async function() {
    const res = await request(app).post(`/invoices`)
      .send({ comp_code: 'apple', amt: "1000"});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(
      {invoice: {
        id : expect.any(Number),
        comp_code : 'apple',
        amt: "1000.00",
        paid: false,
        add_date: expect.any(Date),
        paid_date: null
      }}
    );
  });

  test("POST with duplicate code", async function() {
    const res = await request(app).post(`/invoices`)
      .send({ code: 'apple', name: "Orange", description: "An orange company"});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      {	"error": {
        "message": "Bad Request",
        "status": 400
      }}
    );
  });
});

describe("PUT /invoices/:code", function () {
  test("Updates a company", async function() {
    const res = await request(app).put(`/invoices/${testCompany.code}`)
      .send({ name: "Orange", description: "An orange company"});
    expect(res.body).toEqual(
      {company: {
        code : 'apple',
        name : 'Orange',
        description: 'An orange company'
      }}
    );
  });

  test("Update company with invalid code", async function() {
    const res = await request(app).put(`/invoices/hello`)
      .send({ name: "Orange", description: "An orange company"});
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(
      {	"error": {
        "message": "Not Found",
        "status": 404
      }}
    );
  });
});

describe("DELETE /invoices/:code", function () {
  test("Deletes a company", async function() {
    const res = await request(app).delete(`/invoices/${testCompany.code}`);
    expect(res.body).toEqual(
      {status: 'Deleted'}
    );
  });

  test("Delete company with invalid code", async function() {
    const res = await request(app).delete(`/invoices/hello`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(
      {	"error": {
        "message": "Not Found",
        "status": 404
      }}
    );
  });
});