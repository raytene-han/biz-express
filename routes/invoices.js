"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");
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

/** GET an invoice,
 * returns json {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.get('/:id', async function (req, res) {

  let results = await db.query(
    `SELECT id, amt, paid, add_date, paid_date FROM invoices
    WHERE id = $1`, [req.params.id]
  );
  let invoice = results.rows[0];

  if (!invoice) throw new NotFoundError();

  let compResult = await db.query(
    `SELECT c.code, c.name, c.description
    FROM companies AS c
    JOIN invoices AS i
    ON i.comp_code = c.code
    WHERE i.id = $1;`, [req.params.id]
  );
  invoice.company = compResult.rows[0];

  return res.json({ invoice });
});

/** POST add an invoice, send {comp_code, amt}
 * Returns: json {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post('/', async function (req, res) {
  let { comp_code, amt } = req.body;
  // wrap in try/catch and throw badrequesterror

  let results;

  try {
    results = await db.query(
      `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
    );
  } catch (error) {
    throw new BadRequestError();
  }

  let invoice = results.rows[0];
  return res.status(201).json({ invoice });
});

/** PUT update ammount of an invoice, send {amt}
 * returns json {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.put('/:id', async function (req, res) {

  const id = req.params.id;
  let { amt, paid } = req.body;
  let payDate = paid ? `(SELECT CURRENT_DATE)` : null;

  let results = await db.query(
    `UPDATE invoices
    SET amt = $1, paid = $3, paid_date = ${payDate}
    WHERE id = $2
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id, paid]
  );
  let invoice = results.rows[0];

  if (!invoice) throw new NotFoundError();
  return res.json({ invoice });
});

/** DELETE delete an invoice, returns json {status: "deleted"} */
router.delete('/:id', async function (req, res) {

  const response = await db.query(
    `DELETE FROM invoices
    WHERE id = $1`, [req.params.id]
  );

  if (!response.rowCount) throw new NotFoundError();
  return res.json({ status: "deleted" });
});

module.exports = router;