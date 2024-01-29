document.addEventListener('DOMContentLoaded', function () {
    // Create the navbar dynamically
    const navbar = document.createElement('div');
    navbar.className = 'navbar';
    navbar.innerHTML = `
        <img src="/cloud.png" class="cloud-image" alt="Cloud Image">
        <div class="nav-links">
            <a class="btn" href='/register'>Register</a>
            <a class='btn' href='/login'>Login</a>
            <!-- Add other navigation links as needed -->
        </div>
    `;

    // Insert the navbar at the beginning of the body
    document.body.insertBefore(navbar, document.body.firstChild);
});