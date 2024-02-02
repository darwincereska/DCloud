document.addEventListener('DOMContentLoaded', function () {
    // Create the navbar dynamically
    const navbar = document.createElement('div');
    navbar.className = 'navbar';
    navbar.innerHTML = `
        <img src="/cloud.png" class="cloud-image"width=50px height=50px alt="Cloud Image">
        <div class="nav-links">
            <a class="Navbtn" href='/register'>Register</a>
            <a class='Navbtn' href='/login'>Login</a>
            <!-- Add other navigation links as needed -->
        </div>
    `;

    // Insert the navbar at the beginning of the body
    document.body.insertBefore(navbar, document.body.firstChild);
});