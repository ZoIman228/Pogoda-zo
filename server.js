const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "users.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("DB open error", err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/register", (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email і пароль обов'язкові" });
  const emailNorm = String(email).trim().toLowerCase();
  const nameVal = name ? String(name).trim() : null;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error("Hash error", err);
      return res.status(500).json({ error: "Помилка сервера" });
    }
    const stmt = db.prepare(
      "INSERT INTO users (email, name, password) VALUES (?, ?, ?)",
    );
    stmt.run([emailNorm, nameVal, hash], function (err) {
      if (err) {
        console.error("DB insert error", err);
        if (err.message && err.message.includes("UNIQUE")) {
          return res
            .status(409)
            .json({ error: "Користувач з таким email вже існує" });
        }
        return res.status(500).json({ error: "Помилка бази даних" });
      }
      return res.json({ success: true, id: this.lastID, email: emailNorm });
    });
    stmt.finalize();
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email і пароль обов'язкові" });
  const emailNorm = String(email).trim().toLowerCase();
  db.get(
    "SELECT id, email, name, password FROM users WHERE email = ?",
    [emailNorm],
    (err, row) => {
      if (err) {
        console.error("DB lookup error", err);
        return res.status(500).json({ error: "Помилка бази даних" });
      }
      if (!row) {
        return res.status(401).json({ error: "Невірний email або пароль" });
      }
      bcrypt.compare(password, row.password, (errCmp, ok) => {
        if (errCmp) {
          console.error("Compare error", errCmp);
          return res.status(500).json({ error: "Помилка сервера" });
        }
        if (!ok) {
          return res.status(401).json({ error: "Невірний email або пароль" });
        }
        return res.json({
          success: true,
          id: row.id,
          email: row.email,
          name: row.name,
        });
      });
    },
  );
});

app.use(express.static(path.join(__dirname, ".")));

function startServer(initialPort, maxAttempts = 20) {
  const port = Number(initialPort) || 0;
  const server = app.listen(port, () => {
    const finalPort = server.address().port;
    console.log(`Server running at http://localhost:${finalPort}`);
    console.log(`DB file: ${DB_PATH}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && maxAttempts > 0) {
      const nextPort = (Number(port) || 3000) + 1;
      console.warn(`Port ${port} in use, trying ${nextPort}...`);
      setTimeout(() => startServer(nextPort, maxAttempts - 1), 200);
    } else {
      console.error("Server error", err);
      process.exit(1);
    }
  });
}

const PORT = process.env.PORT || 3000;
startServer(PORT);
