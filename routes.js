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

// Middleware

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

// Loads login.html
router.get("/login", (req, res) => {
  res.render("login.html");
});
// Checks if Login is correct
router.get("/login/authenticate", async (req, res) => {
  const accountsPath = path.join(__dirname, "accounts.json");
  const { username, password } = req.query;
  const accounts = require(accountsPath);

  const user = accounts.find((account) => account.username === username);

  if (user && (await bcrypt.compare(password, user.password))) {
    res.cookie("login", username);
    console.log("Login Successful. Cookie set.");
    res.redirect("/");
  } else {
    console.log("Invalid login credentials.");
    res.status(401).send("Invalid login credentials");
  }
});
// Loads register.html
router.post("/register", async (req, res) => {
  try {
    const accountsPath = path.join(__dirname, "accounts.json");
    const { username, password } = req.body;

    const accounts = require(accountsPath);
    const existingUser = accounts.find((user) => user.username === username);

    if (existingUser) {
      return res
        .status(400)
        .send("Username already exists. Choose a different one.");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
      username: username,
      password: hashedPassword,
    };

    accounts.push(newUser);
    fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2));

    res.status(200).send("Registration successful. You can now login.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
// Loads all user files
router.get("/uploads", async (req, res) => {
  try {
    const user = req.cookies.login;
    const userUploadsPath = path.join(__dirname, "uploads", user);
    const files = await fs.readdir(userUploadsPath);

    res.json({
      files: files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
// loads homepage
router.get("/", (req, res) => {
  res.render("home.html");
});
// removes login cookie
router.get("/logout", (req, res) => {
  res.clearCookie("login");
  res.redirect("/login");
});
// loads register.html
router.get("/register", (req, res) => {
  res.render("register.html");
});
// loads uploads.html
router.get("/files", (req, res) => {
  res.render("uploads.html");
});
// handles uploading logic
router.post("/upload", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    const file = req.files.file;
    const originalName = file.name;
    const type = file.mimetype;
    const size = file.size;
    const user = req.cookies.login;

    if (size > 10000000000) {
      return res.send("Sorry, that file is too large.");
    }

    const userFolderPath = path.join(__dirname, "uploads", user);

    try {
      await fs.mkdir(userFolderPath, { recursive: true });
    } catch (mkdirError) {
      console.error("Error creating user folder:", mkdirError);
      return res.status(500).send("Internal Server Error");
    }

    let compressedImageBuffer;
    let compressedSize;

    if (type.startsWith("image")) {
      compressedImageBuffer = await sharp(file.data)
        .rotate()
        .jpeg({ quality: 50 })
        .toBuffer();
      compressedSize = compressedImageBuffer.length;
    } else {
      compressedImageBuffer = file.data;
      compressedSize = size;
    }

    const existingFiles = await fs.readdir(userFolderPath);
    if (existingFiles.includes(originalName)) {
      return res
        .status(400)
        .send(
          "File with the same name already exists. Please choose a different name.",
        );
    }

    db.set(originalName, {
      name: originalName,
      type,
      size: compressedSize,
      user,
      folder: user,
    });

    await fs.writeFile(
      path.join(userFolderPath, originalName),
      compressedImageBuffer,
    );

    res.redirect(`/file/${user}/${originalName}`);
    console.log("File Uploaded");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
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
// displays full file
router.get("/uploads/:user/:filename", (req, res) => {
  const { user, filename } = req.params;

  if (
    Object.keys(db.storage).includes(filename) &&
    db.get(filename).user === user
  ) {
    res.sendFile(path.join(process.cwd(), "uploads", user, filename));
  } else {
    res.redirect("/");
  }
});
// downloads file
router.get("/uploads/:user/:filename/download", (req, res) => {
  const { user, filename } = req.params;

  if (
    Object.keys(db.storage).includes(filename) &&
    db.get(filename).user === user
  ) {
    res.download(path.join(process.cwd(), "uploads", user, filename));
  } else {
    res.redirect("/");
  }
});
// 404 page
router.get("/*", (req, res) => {
  res.render("404.html");
});

module.exports = router;
