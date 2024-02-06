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
// const db = new JSONdb("./db.json");
const cookieParser = require("cookie-parser");
const sharp = require("sharp");
const app = express();

// Middleware

router.use(fileUpload({ createParentPath: true }));
router.use(cookieParser());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));




// loads homepage
router.get("/admin/dashboard", (req, res) => {
  res.render("admin.html");
});
//

// Route to send analytic data
router.post("/analytics", async (req, res) => {
  try {
    const analyticData = req.body;
    const analyticsFilePath = path.join(__dirname,"../analytics.json");

    let existingAnalytics = [];
    try {
      const existingData = await fs.readFile(analyticsFilePath, "utf8");
      existingAnalytics = JSON.parse(existingData);
    } catch (error) {
      // File does not exist yet or is empty
    }

    // Check if the page name already exists in analytics
    const existingPage = existingAnalytics.find((entry) => entry.pageName === analyticData.pageName);

    if (existingPage) {
      // If page exists, increment the counter
      existingPage.count += 1;
    } else {
      // If page doesn't exist, add a new entry with count 1
      existingAnalytics.push({ pageName: analyticData.pageName, count: 1 });
    }

    await fs.writeFile(analyticsFilePath, JSON.stringify(existingAnalytics, null, 2), "utf8");

    res.status(200).json({ success: true, message: "Analytic data sent successfully" });
  } catch (error) {
    console.error("Error sending analytic data:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Route to get all analytic data
router.get("/analytics", async (req, res) => {
  try {
    const analyticsFilePath = path.join(__dirname,"../analytics.json");

    // Read existing analytics data
    let existingAnalytics = [];
    try {
      const existingData = await fs.readFile(analyticsFilePath, "utf8");
      existingAnalytics = JSON.parse(existingData);
    } catch (error) {
      // File does not exist yet or is empty
    }

    res.status(200).json({ success: true, data: existingAnalytics });
  } catch (error) {
    console.error("Error retrieving analytic data:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});



module.exports = router;
