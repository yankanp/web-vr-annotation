const fs = require("fs");
const path = require("path");
const https = require("https");
const express = require("express");
const WebSocket = require("ws");

// Certificates from mkcert: mkcert localhost 127.0.0.1 ::1
const options = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = https.createServer(options, app);
const wss = new WebSocket.Server({ server });

let vrClient = null;
let annotationClient = null;

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    console.log("Server got:", data.type);

    if (data.type === "register") {
      if (data.role === "vr") vrClient = ws;
      if (data.role === "annotation") annotationClient = ws;
      return;
    }

    if (data.type === "offer" && annotationClient) {
      annotationClient.send(JSON.stringify(data));
    }
    if (data.type === "answer" && vrClient) {
      vrClient.send(JSON.stringify(data));
    }
    if (data.type === "ice") {
      if (data.role === "vr" && annotationClient) annotationClient.send(JSON.stringify(data));
      if (data.role === "annotation" && vrClient) vrClient.send(JSON.stringify(data));
    }

    // Forward annotation messages
    if (data.type === "annotation" && vrClient) {
      vrClient.send(JSON.stringify(data));
    }

    // Forward text messages
    if (data.type === "text" && vrClient) {
      vrClient.send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    if (ws === vrClient) vrClient = null;
    if (ws === annotationClient) annotationClient = null;
  });
});

server.listen(8080, () => {
  console.log("🚀 Server running at https://localhost:8080");
});
