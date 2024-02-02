// mailRoutes.js
// Contansts
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");
const JSONdb = require("simple-json-db");
const db = new JSONdb("./db.json");
const cookieParser = require("cookie-parser");
const sharp = require("sharp");
const app = express();

// Middleware

router.use(fileUpload({ createParentPath: true }));
router.use(cookieParser());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));




// loads homepage
router.get("/mail", (req, res) => {
  res.render("home.html");
});
//


module.exports = router;
