"use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");
const { processData } = require("./processor");

const app = express();

app.use(cors()); // evaluator calls from a different origin
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ====== EDIT THESE TO YOUR REAL CREDENTIALS ======
const IDENTITY = {
  user_id: "aditya_pathania_09012005", // format: fullname_ddmmyyyy
  email_id: "aditya0352.be23@chitkara.edu.in",
  college_roll_number: "2310990352",
};
// =================================================

app.post("/bfhl", (req, res) => {
  try {
    const body = req.body || {};
    const data = body.data;

    if (!Array.isArray(data)) {
      return res.status(400).json({
        ...IDENTITY,
        error: "Request body must contain a 'data' array.",
        hierarchies: [],
        invalid_entries: [],
        duplicate_edges: [],
        summary: { total_trees: 0, total_cycles: 0, largest_tree_root: "" },
      });
    }

    const result = processData(data);
    return res.status(200).json({ ...IDENTITY, ...result });
  } catch (err) {
    return res.status(500).json({ ...IDENTITY, error: "Internal server error." });
  }
});

// Health check / GET helper
app.get("/bfhl", (_req, res) => {
  res.status(200).json({ operational: true, expects: "POST with { data: [...] }" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`bfhl API running on :${PORT}`));

module.exports = app;
