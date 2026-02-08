const express = require("express");
const Need = require("../models/Need");

const router = express.Router();

router.post("/create", async (req, res) => {
  const need = await Need.create(req.body);
  res.json(need);
});

router.get("/ngo/:ngoId", async (req, res) => {
  const needs = await Need.find({ ngoId: req.params.ngoId });
  res.json(needs);
});

module.exports = router;
