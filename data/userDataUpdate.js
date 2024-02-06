// userDataUpdate.js

const fs = require("fs").promises;
const path = require("path");

const userDataPath = path.join(__dirname, "userData.json");
let userData = {};

async function loadUserData() {
  try {
    await fs.promises.access(userDataPath);
    const data = await fs.promises.readFile(userDataPath, "utf-8");
    userData = JSON.parse(data);
  } catch (error) {
    userData = {};
  }
}

loadUserData();

function updateUserData(username, dataToUpdate) {
  if (!userData[username]) {
    userData[username] = {
      totalUploads: 0,
      favoriteFiles: [],
    };
  }

  userData[username] = {
    ...userData[username],
    ...dataToUpdate,
  };

  userDataSorted = Object.fromEntries(
    Object.entries(userData).sort((a, b) => a[0].localeCompare(b[0])),
  );

  fs.writeFile(userDataPath, JSON.stringify(userDataSorted, null, 2));
}

module.exports = {
  loadUserData,
  updateUserData,
};