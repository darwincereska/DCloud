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
// Checks if Login is correct
router.get("/login/authenticate", async (req, res) => {
  const accountsPath = path.join(__dirname, "accounts.json");
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

// Function to generate a unique token
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// Loads register.html
// ...

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

// ...

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

// Loads all user files
// ...
// Loads all user files
router.get("/uploads", async (req, res) => {
  try {
    const loggedInUser = req.cookies.login;
    const loggedInToken = req.cookies.token;

    if (!loggedInUser || !loggedInToken) {
      return res.status(401).send("Unauthorized");
    }

    // Validate the session by both login and token
    const validSession = await isValidSessionByLoginAndToken(loggedInUser, loggedInToken);

    if (!validSession) {
      return res.status(401).send("Unauthorized");
    }

    const userUploadsPath = path.join(__dirname, "uploads", loggedInUser);
    const files = await fs.readdir(userUploadsPath);

    res.json({
      files: files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


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


// ...

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
