// analytics.js

// Function to send page name and update counter
function trackPage(pageName) {
  // Fetch the existing analytics data from the server or any storage
  fetch("/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pageName }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("Analytic data sent successfully");
      } else {
        console.error("Failed to send analytic data");
      }
    })
    .catch((error) => {
      console.error("Error sending analytic data:", error);
    });
}

// Example usage:
// Call this function on each page load with the corresponding page name
// For example, on your HTML pages, you can include the following line:
// <script src="path/to/analytics.js"></script>
// <script>
//   trackPage("home"); // Call this on each page load with the corresponding page name
// </script>
