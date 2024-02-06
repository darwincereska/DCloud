// index.js

const express = require("express");
const app = express();
const path = require("path");
const port = 80;
app.set("views", path.join(__dirname, "src/pages"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
// Serve static files from the 'public' directory
app.use('/assets',express.static(path.join(__dirname, "src/assets")));
app.use('/styles',express.static(path.join(__dirname, "src/styles")));
app.use('/components',express.static(path.join(__dirname, "src/components")));
// Import your routes
const routes = require("./routes");


// Use the routes in your Express app
app.use(routes);


// Start the server
app.listen(port, () => {
  console.clear();
  console.log(`Server is running on http://localhost:${port}`);
});
