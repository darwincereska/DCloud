const fs = require('fs');
const path = require('path');

// Define the file and folder paths
const accountsFilePath = 'accounts.json';
const uploadsFolderPath = 'uploads';
const statsFilePath = 'analytics.json'

// Data to write to the accounts.json file (empty array [])
const accountsData = [];
const analyticData = []

// Convert data to JSON format
const accountsJsonData = JSON.stringify(accountsData, null, 2); // Adding null and 2 for pretty formatting
const analyticJsonData = JSON.stringify(analyticData, null, 2)
// Create the uploads folder
fs.mkdir(uploadsFolderPath, { recursive: true }, (err) => {
  if (err) {
    console.error('Error creating uploads folder:', err);
  } else {
    console.log('uploads folder created successfully.');

    // Write data to the accounts.json file
    fs.writeFile(accountsFilePath, accountsJsonData, (err) => {
      if (err) {
        console.error('Error creating accounts.json:', err);
      } else {
        console.log('accounts.json created successfully with an empty array.');
      }
    });
  }
});
