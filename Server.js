import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const TOKEN = process.env.TOKEN;

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// 👉 NEW: serve .well-known folder for plugin + OpenAPI spec
app.use('/.well-known', express.static('.well-known'));

// ChatGPT API endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, apiKey } = req.body;
  
  if (!messages || !apiKey) {
    return res.status(400).json({ error: "Missing messages or API key" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || "OpenAI API error" 
      });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "No response from ChatGPT" });
    }

    res.json({ content });
  } catch (err) {
    console.error("ChatGPT API Error:", err);
    res.status(500).json({ error: "Failed to connect to ChatGPT" });
  }
});

// Serve the web interface at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post("/api/exec", async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Relay running on port ${PORT}`);
});
