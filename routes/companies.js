"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db");
const router = express.Router();

/** GET all companies, returns json {companies: [{code, name}, ...]} */
router.get('/', async function (req, res) {
  let results = await db.query(
    `SELECT code, name FROM companies;`
  );
  let companies = results.rows;
  return res.json({ companies });
});

/** GET a company,
 *  returns json {company: {code, name, description, invoices: [id, ...]}} */
router.get('/:code', async function (req, res) {
  let results = await db.query(
    `SELECT code, name, description FROM companies
    WHERE code = $1`, [req.params.code]
  );
  let company = results.rows[0];

  if (!company) throw new NotFoundError();

  let invoiceRes = await db.query(
    `SELECT id FROM invoices
    WHERE comp_code = $1`, [req.params.code]
  );

  let invoices = invoiceRes.rows.map(i => i.id);
  company.invoices = invoices;

  return res.json({ company });
});

/** POST add a company, returns json {company: {code, name, description}}*/
router.post('/', async function (req, res) {
  let { code, name, description } = req.body;
  let results;

  try {
    results = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`, [code, name, description]
    );
  } catch(error) {
    throw new BadRequestError;
  }

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