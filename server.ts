import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

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

  // Proxy route to fetch external website HTML for inspector
  app.post("/api/fetch-url", async (req, res) => {
    try {
      let { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL é obrigatória" });
      }

      url = url.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      const parsedUrl = new URL(url);

      const response = await fetch(parsedUrl.href, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: `Falha ao carregar site: HTTP ${response.status} ${response.statusText}` });
      }

      let html = await response.text();

      // Inject base tag so relative links, images, and styles resolve to original host
      const origin = parsedUrl.origin;
      const baseTag = `<base href="${origin}/">`;

      if (!/<base\s/i.test(html)) {
        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/(<head[^>]*>)/i, `$1\n${baseTag}`);
        } else if (/<html[^>]*>/i.test(html)) {
          html = html.replace(/(<html[^>]*>)/i, `$1\n<head>${baseTag}</head>`);
        } else {
          html = `<head>${baseTag}</head>\n` + html;
        }
      }

      res.json({ success: true, url: parsedUrl.href, html });
    } catch (error: any) {
      console.error("Erro ao buscar URL externa:", error);
      res.status(500).json({
        error: "Não foi possível carregar a URL fornecida: " + (error.message || "Erro de conexão"),
      });
    }
  });

  // Download extension zip endpoint
  app.get("/api/download-extension-zip", (req, res) => {
    const zipPath = path.join(process.cwd(), "edge-sidepanel-inspector-extension.zip");
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, "edge-sidepanel-inspector-extension.zip");
    } else {
      res.status(404).json({ error: "Ficheiro zip da extensão não encontrado. Por favor compile a extensão." });
    }
  });

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

      console.log("Creating snippet with ID:", id);
      stmt.run(id, code, language, title, description, tags, visibility || 'public', passwordHash, expiresAt);
      console.log("Snippet created successfully");

      res.json({ id });
    } catch (error: any) {
      console.error("Error creating snippet:", error);
      res.status(500).json({ error: "Failed to create snippet: " + error.message });
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
