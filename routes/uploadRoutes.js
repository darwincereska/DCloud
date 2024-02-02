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

    const userUploadsPath = path.join(__dirname, "../uploads", loggedInUser);
    const files = await fs.readdir(userUploadsPath);

    res.json({
      files: files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
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

    const userFolderPath = path.join(__dirname, "../uploads", user);

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
// Function to generate a unique token
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// Function to validate the session by token
async function isValidSessionByToken(token) {
  try {
    const accountsPath = path.join('../', "accounts.json");
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
    const accountsPath = path.join('../', "accounts.json");
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




module.exports = router;
