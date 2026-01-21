const express = require("express");
const app = express();
const PORT = 3005;

app.get("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error("Error starting server:", err);
  } else {
    console.log(`Test server running on port ${PORT}`);
  }
});
