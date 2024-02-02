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

// Loads register.html
router.post("/register", async (req, res) => {
  try {
    const accountsPath = path.join('../', "accounts.json");
    const { username, password } = req.body;

    const accounts = require(accountsPath);
    const existingUser = accounts.find((user) => user.username === username);

    if (existingUser) {
      return res
        .status(400)
        .send("Username already exists. Choose a different one.");
    }

    const token = generateToken(); // Add a function to generate a unique token

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
      username: username,
      password: hashedPassword,
      token: token,
    };

    accounts.push(newUser);
    fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2));

    // Set the token as a cookie
    res.cookie("token", token, { httpOnly: true });

    res.status(200).send("Registration successful. You can now login.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
// Loads login.html
router.get("/login", (req, res) => {
  res.render("login.html");
});


// Checks if Login is correct
router.get("/login/authenticate", async (req, res) => {
  const accountsPath = path.join('../', "accounts.json");
  const { username, password } = req.query;
  const accounts = require(accountsPath);

  const user = accounts.find((account) => account.username === username);

  if (user && (await bcrypt.compare(password, user.password))) {
    // Generate a unique token for the user
    const token = user.token;

    // Set both login and token cookies
    res.cookie("login", username);
    res.cookie("token", token, { httpOnly: true });

    console.log("Login Successful. Cookies set.");
    res.redirect("/");
  } else {
    console.log("Invalid login credentials.");
    res.status(401).send("Invalid login credentials");
  }
});

// removes login cookie
router.get("/logout", (req, res) => {
  res.clearCookie("login");
  res.clearCookie("token")
  res.redirect("/login");
});
// loads register.html
router.get("/register", (req, res) => {
  res.render("register.html");
});


module.exports = router;
