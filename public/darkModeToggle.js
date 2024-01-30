// darkModeToggle.js

// Function to toggle the dark cookie value between true and false
function toggleDarkCookie() {
    // Get the current value of the dark cookie from localStorage (default to false if not set)
    var darkCookie = JSON.parse(localStorage.getItem('darkCookie')) || false;

    // Toggle the dark cookie value
    darkCookie = !darkCookie;

    // Save the updated dark cookie value to localStorage
    localStorage.setItem('darkCookie', JSON.stringify(darkCookie));

    // Change the stylesheet based on the darkCookie value
    updateStylesheet(darkCookie);
}

// Function to update the stylesheet based on the darkCookie value
function updateStylesheet(darkMode) {
    var stylesheetLink = document.getElementById('stylesheetLink');

    // Use dark.css if darkMode is true, otherwise use drive.css
    var stylesheetPath = darkMode ? 'dark.css' : 'drive.css';

    // Update the href attribute of the stylesheet link
    stylesheetLink.href = stylesheetPath;
}

// Auto-check darkCookie before the styles load
document.addEventListener('DOMContentLoaded', function() {
    // Get the current value of the dark cookie from localStorage (default to false if not set)
    var darkCookie = JSON.parse(localStorage.getItem('darkCookie')) || false;

    // Change the stylesheet based on the darkCookie value
    updateStylesheet(darkCookie);
});

// Add styles dynamically
var styles = `
    body {
        margin: 0;
        padding: 0;
        overflow: hidden;
    }

    #moonButton {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background-color: #000;
        color: #fff;
        border: none;
        padding: 15px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    body.dark-mode #moonButton {
        background-color: #fff;
        color: #000;
    }
`;

// Create a style tag and append it to the head
var styleTag = document.createElement('style');
styleTag.textContent = styles;
document.head.appendChild(styleTag);
