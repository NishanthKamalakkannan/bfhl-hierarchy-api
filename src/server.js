const express = require("express");
const cors = require("cors");
const path = require("path");
const { processHierarchyPayload } = require("./hierarchy");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const USER_ID = process.env.USER_ID || "yourname_ddmmyyyy";
const EMAIL_ID = process.env.EMAIL_ID || "you@college.edu";
const COLLEGE_ROLL_NUMBER = process.env.COLLEGE_ROLL_NUMBER || "yourrollnumber";

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.post("/bfhl", (req, res) => {
  const payload = req.body ?? {};

  if (!Array.isArray(payload.data)) {
    return res.status(400).json({
      error: "Invalid request body. 'data' must be an array of strings.",
    });
  }

  const processed = processHierarchyPayload(payload.data);

  return res.json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies: processed.hierarchies,
    invalid_entries: processed.invalidEntries,
    duplicate_edges: processed.duplicateEdges,
    summary: processed.summary,
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
