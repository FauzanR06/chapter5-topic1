const express = require("express");
const router = express.Router();
const classes = require("./class");
const student = require("./student");

router.use("/classes", classes);
router.use("/student", student);

module.exports = router;
