document.addEventListener("DOMContentLoaded", function () {
  // Create the navbar dynamically
  const navbar = document.createElement("div");
  navbar.className = "navbar";
  navbar.innerHTML = `
        <a href='/'><img src="/assets/cloud.png" class="cloud-image" width=50px height=50px alt="Cloud Image"></a>
        
        <div class="nav-links">
            <a class="Navbtn" href='/files'>Files</a>
            <a class='Navbtn' href='/login'>Logout</a>
        </div>
    `;

  // Insert the navbar at the beginning of the body
  document.body.insertBefore(navbar, document.body.firstChild);
});
