const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/save", (req, res) => {
  const content = JSON.stringify(req.body, null, 2);
  const filePath = path.join(__dirname, "src", "editorContent.json");

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      res.status(500).json({ error: "Failed to save file" });
      return;
    }
    res.json({ success: true });
  });
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
