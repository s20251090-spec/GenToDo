import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Streaming AI endpoint
  app.post("/api/stream", express.json(), async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const { ENV } = await import("./env");
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).json({ error: "AI API not configured" });
      return;
    }

    try {
      const response = await fetch(`${ENV.forgeApiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          model: "manus-1.6-lite",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Forge API error:", error);
        res.status(500).json({ error: `Forge API error: ${response.status}` });
        return;
      }

      const data = await response.json();
      let result = "";
      if (data.choices && data.choices[0] && data.choices[0].message) {
        result = data.choices[0].message.content;
      } else if (data.result) {
        result = data.result;
      } else if (data.content) {
        result = data.content;
      } else if (data.text) {
        result = data.text;
      }

      // Stream the response character by character
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Send each character as a separate event
      for (let i = 0; i < result.length; i++) {
        res.write(`data: ${JSON.stringify({ char: result[i], index: i })}\n\n`);
        // Small delay to create streaming effect
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Streaming error:", error);
      res.status(500).json({ error: `Failed to stream content: ${error instanceof Error ? error.message : "Unknown error"}` });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
