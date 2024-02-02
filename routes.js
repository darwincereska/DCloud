// routes.js
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
const mailRoutes = require("./routes/mailRoutes");
const loginRoutes = require("./routes/loginRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const routespath = 'routes'
// Middleware
router.use(mailRoutes);
router.use(loginRoutes)
router.use(uploadRoutes)
router.use(fileUpload({ createParentPath: true }));
router.use(cookieParser());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Authentication Middleware
router.use((req, res, next) => {
  const exemptedRoutes = [
    "/register",
    "/uploads",
    "/login",
    "/file",
    "/login/authenticate",
  ];
  const loggedIn = req.cookies.login;

  if (exemptedRoutes.some((route) => req.path.startsWith(route)) || loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});
// Define Routes
// Function to generate a unique token
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}
// Authentication Middleware
router.use(async (req, res, next) => {
  const exemptedRoutes = [
    "/register",
    "/uploads",
    "/login",
    "/file",
    "/login/authenticate",
  ];

  const loggedInToken = req.cookies.token;
  const validSession = await isValidSessionByToken(loggedInToken); // Add a function to validate the session by token

  if (
    exemptedRoutes.some((route) => req.path.startsWith(route)) ||
    (loggedInToken && validSession)
  ) {
    next();
  } else {
    res.redirect("/login");
  }
});
// Function to validate the session by token
async function isValidSessionByToken(token) {
  try {
    const accountsPath = path.join(__dirname, "accounts.json");
    const accounts = require(accountsPath);
    const user = accounts.find((account) => account.token === token);
    return !!user; // Returns true if the user with the token exists, false otherwise
  } catch (error) {
    console.error("Error validating session by token:", error);
    return false;
  }
}
// Function to generate a unique token
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}
// Function to validate the session by both login and token
async function isValidSessionByLoginAndToken(login, token) {
  try {
    const accountsPath = path.join(__dirname, "accounts.json");
    const accounts = require(accountsPath);

    // Check if there's a user with the provided login and token
    const validUser = accounts.find((account) => account.username === login && account.token === token);

    if (validUser) {
      console.log(`Valid session for user: ${login}`);
      return true;
    } else {
      console.log(`Invalid session for user: ${login}`);
      return false;
    }
  } catch (error) {
    console.error("Error validating session by login and token:", error);
    return false;
  }
}
// loads homepage
router.get("/", (req, res) => {
  res.render("home.html");
});

// loads file.html and viewing correct file
router.get("/file/:user/:filename", (req, res) => {
  const filename = req.params.filename;
  const user = req.params.user;

  if (
    Object.keys(db.storage).includes(filename) &&
    db.get(filename).user === user
  ) {
    const info = db.get(filename);
    const size = info.size;

    let displayedSize;

    if (size > 1000000) {
      displayedSize = (size / 1000000).toFixed(2) + " MB";
    } else if (size > 1000) {
      displayedSize = (size / 1000).toFixed(2) + " KB";
    } else {
      displayedSize = size + " Bytes";
    }

    info.size = displayedSize;

    res.render("file.html", {
      filename: info.name,
      type: info.type,
      size: info.size,
      user: info.user,
      loggedInUser: req.cookies.login,
    });
  } else {
    res.redirect("/");
  }
});
// 404 page
router.get("/*", (req, res) => {
  res.render("404.html");
});

module.exports = router;
