// index.js

const express = require("express");
const app = express();
const path = require("path");
const port = 80;
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
// Import your routes
const routes = require("./routes");


// Use the routes in your Express app
app.use(routes);


// Start the server
app.listen(port, () => {
  console.clear();
  console.log(`Server is running on http://localhost:${port}`);
});
