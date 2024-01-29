document.addEventListener("DOMContentLoaded", function () {
  // Create the navbar dynamically
  const navbar = document.createElement("div");
  navbar.className = "navbar";
  navbar.innerHTML = `
        <a href='/'><img src="/cloud.png" class="cloud-image" alt="Cloud Image"></a>
        
        <div class="nav-links">
            <a class="btn" href='/files'>Files</a>
            <!-- Add other navigation links as needed -->
        </div>
    `;

  // Insert the navbar at the beginning of the body
  document.body.insertBefore(navbar, document.body.firstChild);
});
