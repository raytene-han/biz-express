"use strict";

const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require("../db");
const router = express.Router();

/** GET all companies */
router.get('/', async function (req, res) {
  let results = await db.query(
    `SELECT code, name FROM companies;`
  );
  let companies = results.rows;
  return res.json({ companies });
});

/** GET a company */
router.get('/:code', async function (req, res) {
  let results = await db.query(
    `SELECT code, name, description FROM companies
    WHERE code = $1`, [req.params.code]
  );
  let company = results.rows[0];
  if (!company) throw new NotFoundError();
  return res.json({ company });
});

/** POST add a company*/
router.post('/', async function (req, res) {
  let { code, name, description } = req.body;
  let results = await db.query(
    `INSERT INTO companies (code, name, description)
    VALUES ($1, $2, $3)
    RETURNING code, name, description`, [code, name, description]
  );
  let company = results.rows[0];
  return
})
/** PUT update a comany*/
/** DELETE delete a company */

module.exports = router;