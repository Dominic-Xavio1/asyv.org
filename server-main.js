import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { initSocketIO } from "./src/services/socketio/initSocketServer.js";
import { handleChatMediaUpload } from "./src/services/uploads/handleChatMediaUpload.js";

export async function start() {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = process.env.HOSTNAME || "localhost";
  const port = parseInt(process.env.PORT || "3000", 10);

  const app = next({ dev, hostname, port, turbopack: dev });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const pathname = parsedUrl.pathname?.replace(/\/$/, "") || "/";
      if (req.method === "POST" && pathname === "/api/upload/group-message") {
        await handleChatMediaUpload(req, res);
        return;
      }
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  await initSocketIO(httpServer);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO listening on path /api/socketio`);
    });
}
