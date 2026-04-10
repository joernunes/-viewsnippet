import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

const db = new Database("snippets.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    title TEXT,
    description TEXT,
    tags TEXT,
    visibility TEXT DEFAULT 'public',
    password_hash TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/snippets", async (req, res) => {
    try {
      const { code, language, title, description, tags, visibility, password, expiresInDays } = req.body;

      if (!code || !language) {
        return res.status(400).json({ error: "Code and language are required" });
      }

      const id = nanoid(10);
      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      let expiresAt = null;
      if (expiresInDays) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(expiresInDays));
        expiresAt = date.toISOString();
      }

      const stmt = db.prepare(`
        INSERT INTO snippets (id, code, language, title, description, tags, visibility, password_hash, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, code, language, title, description, tags, visibility || 'public', passwordHash, expiresAt);

      res.json({ id });
    } catch (error) {
      console.error("Error creating snippet:", error);
      res.status(500).json({ error: "Failed to create snippet" });
    }
  });

  app.get("/api/snippets/:id", (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare("SELECT * FROM snippets WHERE id = ?");
      const snippet = stmt.get(id) as any;

      if (!snippet) {
        return res.status(404).json({ error: "Snippet not found" });
      }

      // Check expiration
      if (snippet.expires_at && new Date(snippet.expires_at) < new Date()) {
        return res.status(404).json({ error: "Snippet has expired" });
      }

      // If password protected, don't send code yet
      if (snippet.password_hash) {
        return res.json({
          id: snippet.id,
          title: snippet.title,
          description: snippet.description,
          tags: snippet.tags,
          language: snippet.language,
          created_at: snippet.created_at,
          isProtected: true
        });
      }

      // Remove sensitive info
      delete snippet.password_hash;
      res.json({ ...snippet, isProtected: false });
    } catch (error) {
      console.error("Error fetching snippet:", error);
      res.status(500).json({ error: "Failed to fetch snippet" });
    }
  });

  app.post("/api/snippets/:id/unlock", async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const stmt = db.prepare("SELECT * FROM snippets WHERE id = ?");
      const snippet = stmt.get(id) as any;

      if (!snippet) {
        return res.status(404).json({ error: "Snippet not found" });
      }

      if (!snippet.password_hash) {
        return res.status(400).json({ error: "Snippet is not password protected" });
      }

      const match = await bcrypt.compare(password, snippet.password_hash);
      if (!match) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      delete snippet.password_hash;
      res.json({ ...snippet, isProtected: false });
    } catch (error) {
      console.error("Error unlocking snippet:", error);
      res.status(500).json({ error: "Failed to unlock snippet" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
