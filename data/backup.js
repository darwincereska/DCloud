// hi
const bcrypt = require('bcrypt')
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const JSONdb = require('simple-json-db');
const db = new JSONdb('./db.json');
const fs = require('fs').promises;
const path = require('path')
const app = express();
const cookieParser = require("cookie-parser")
const port = 3000
const uploadLimit = process.env.UPLOADLIMIT;
app.use(
    fileUpload({
        createParentPath: true
    })
);
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static('public'))
    // Middleware for Authentication
app.use((req, res, next) => {
    const exemptedRoutes = ['/register', '/uploads', '/login', '/file', '/login/authenticate']; // Add routes that don't require authentication
    const loggedIn = req.cookies.login;

    if (exemptedRoutes.some(route => req.path.startsWith(route)) ||
        loggedIn) {
        next(); // Allow access to exempted routes or if already logged in
    } else { // ... (previous server setup code)
        res.redirect('/login');
    } // Login Route
});



const userDataPath = path.join(__dirname, 'userData.json');

// Load or create userData.json
let userData = {};

async function loadUserData() {
    try {
        await fs.promises.access(userDataPath);
        const data = await fs.promises.readFile(userDataPath, 'utf-8');
        userData = JSON.parse(data);
    } catch (error) {
        // File doesn't exist, create an empty object
        userData = {};
    }
}

// Call the loadUserData function to load or create the file
loadUserData();

// Function to update user data
function updateUserData(username, dataToUpdate) {
    if (!userData[username]) {
        userData[username] = {
            totalUploads: 0,
            favoriteFiles: [],
        };
    }

    // Update the user data as needed
    userData[username] = {
        ...userData[username],
        ...dataToUpdate,
    };

    // Sort userData by login cookie value
    userDataSorted = Object.fromEntries(Object.entries(userData).sort((a, b) => a[0].localeCompare(b[0])));

    // Save updated userData to userData.json
    fs.writeFile(userDataPath, JSON.stringify(userDataSorted, null, 2));
}









app.get('/login', (req, res) => {
    res.render('login.html'); // Assuming you have a login.html file in your views folder
});

app.get('/login/authenticate', async(req, res) => {
    const accountsPath = path.join(__dirname, 'accounts.json');
    const {
        username,
        password
    } = req.query;
    const accounts = require(accountsPath);

    const user = accounts.find((account) => account.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
        res.cookie('login', username);
        console.log('Login Successful. Cookie set.');
        res.redirect('/');
    } else {
        console.log('Invalid login credentials.');
        res.status(401).send('Invalid login credentials');
    }
});

app.post('/register', async(req, res) => {
    try {
        const accountsPath = path.join(__dirname, 'accounts.json');
        const {
            username,
            password
        } = req.body;

        // Check if username already exists
        const accounts = require(accountsPath);
        const existingUser = accounts.find(user => user.username === username);

        if (existingUser) {
            return res.status(400).send('Username already exists. Choose a different one.');
        }

        // Encrypt the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Add new user to accounts.json
        const newUser = {
            username: username,
            password: hashedPassword
        };

        accounts.push(newUser);
        fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2));

        res.status(200).send('Registration successful. You can now login.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/uploads', async(req, res) => {
    try {
        const user = req.cookies.login;
        const userUploadsPath = path.join(__dirname, 'uploads', user);
        
      const files = await fs.readdir(userUploadsPath);


        //        console.log(`Files in ${user}'s Folder:`, files); // Log the files in the user's folder

        res.json({
            files: files
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/', (req, res) => {
    res.render('home.html');
});
app.get('/logout', (req, res) => {
    res.clearCookie('login');
    res.redirect('/login');
});
app.get('/register', (req, res) => {
    res.render('register.html');
});
app.get('/files', (req, res) => {
    res.render('uploads.html');
});
const sharp = require('sharp');

app.post('/upload', async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        const file = req.files.file;
        const originalName = file.name;
        const type = file.mimetype;
        const size = file.size;
        const user = req.cookies.login;

        if (size > 10000000000) {
            return res.send('Sorry, that file is too large.');
        }

        // Create user folder if it doesn't exist
        const userFolderPath = path.join(__dirname, 'uploads', user);

        try {
            await fs.mkdir(userFolderPath, { recursive: true });
        } catch (mkdirError) {
            console.error('Error creating user folder:', mkdirError);
            return res.status(500).send('Internal Server Error');
        }

        let compressedImageBuffer;
        let compressedSize;

        // Check if the file is an image before compression
        if (type.startsWith('image')) {
            // Use sharp to compress the image to 90% quality
            compressedImageBuffer = await sharp(file.data).rotate().jpeg({ quality: 50 }).toBuffer();
            compressedSize = compressedImageBuffer.length;
        } else {
            compressedImageBuffer = file.data;
            compressedSize = size;
        }

        // Check for duplicates
        const existingFiles = await fs.readdir(userFolderPath);
        if (existingFiles.includes(originalName)) {
            return res.status(400).send('File with the same name already exists. Please choose a different name.');
        }

        db.set(originalName, {
            name: originalName,
            type,
            size: compressedSize,
            user,
            folder: user
        });

        await fs.writeFile(path.join(userFolderPath, originalName), compressedImageBuffer);

        res.redirect(`/file/${user}/${originalName}`);
        console.log("File Uploaded");
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/file/:user/:filename', (req, res) => {
    const filename = req.params.filename;
    const user = req.params.user;
    const filePath = `./uploads/${user}/${filename}`;
    const loggedInUser = req.cookies.login;

    if (Object.keys(db.storage).includes(filename) && db.get(filename).user === user) {
        const info = db.get(filename);
        const size = info.size;
        const user = info.user

        

        let displayedSize;

        if (size > 1000000) {
            displayedSize = (size / 1000000).toFixed(2) + ' MB';
        } else if (size > 1000) {
            displayedSize = (size / 1000).toFixed(2) + ' KB';
        } else {
            displayedSize = size + ' Bytes';
        }

        info.size = displayedSize;

        res.render('file.html', {
            filename: info.name,
            type: info.type,
            size: info.size,
            user: info.user,
            loggedInUser: req.cookies.login
        });
    } else {
        res.redirect('/');
    }
});

app.get('/uploads/:user/:filename', (req, res) => {
    const {
        user,
        filename
    } = req.params;

    if (Object.keys(db.storage).includes(filename) && db.get(filename).user === user) {
        res.sendFile(process.cwd() + `/uploads/${user}/` + filename);
    } else {
        res.redirect('/');
    }
});

app.get('/uploads/:user/:filename/download', (req, res) => {
    const {
        user,
        filename
    } = req.params;

    if (Object.keys(db.storage).includes(filename) && db.get(filename).user === user) {
        res.download(process.cwd() + `/uploads/${user}/` + filename);
    } else {
        res.redirect('/');
    }
});

app.get('/*', (req, res) => {
    res.render('404.html');
});

// Update route for adding or removing a filename from the favoriteFile list


app.listen(port, () => {
    console.clear();
    console.log('Server Online.');
});