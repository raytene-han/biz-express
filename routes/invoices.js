"use strict";

const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require("../db");
const router = express.Router();

/** GET all invoices, returns json {invoices: [{id, comp_code}, ...]} */
router.get('/', async function (req, res) {
  let results = await db.query(
    `SELECT id, comp_code FROM invoices;`
  );
  let invoices = results.rows;
  return res.json({ invoices });
});

/** GET a company, returns json {company: {code, name, description}} */
router.get('/:id', async function (req, res) {
  let results = await db.query(
    `SELECT id, amt, paid, add_date, paid_date FROM invoices
    WHERE id = $1`, [req.params.id]
  );
  let invoice = results.rows[0];
  let compResult = await db.query(
    `SELECT c.code, c.name, c.description
    FROM companies AS c
    JOIN invoices AS i
    ON i.comp_code = c.code
    WHERE i.id = $1;`, [req.params.id]
  );

  invoice.company = compResult.rows[0];
  if (!invoice) throw new NotFoundError();
  return res.json({ invoice });
});

/** POST add a company, returns json {company: {code, name, description}}*/
router.post('/', async function (req, res) {
  let { code, name, description } = req.body;
  // wrap in try/catch and throw badrequesterror
  let results = await db.query(
    `INSERT INTO invoices (code, name, description)
    VALUES ($1, $2, $3)
    RETURNING code, name, description`, [code, name, description]
  );
  let company = results.rows[0];
  return res.status(201).json({ company });
});

/** PUT update a company, returns json {company: {code, name, description}}*/
router.put('/:code', async function (req, res) {
  const code = req.params.code;
  let { name, description } = req.body;
  let results = await db.query(
    `UPDATE companies
    SET name = $1,
        description = $2
    WHERE code = $3
    RETURNING code, name, description`, [ name, description, code]
  );
  let company = results.rows[0];
  if (!company) throw new NotFoundError();
  return res.json({ company });
});

/** DELETE delete a company, returns json {status: "deleted"} */
router.delete('/:code', async function (req, res) {
  const response = await db.query(
    `DELETE FROM companies
    WHERE code = $1`, [req.params.code]
  );
  if (!response.rowCount) throw new NotFoundError();
  return res.json({ status: "Deleted" });
});

module.exports = router;