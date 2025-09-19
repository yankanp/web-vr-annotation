const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");

// Load certs (replace with your cert file paths)
const server = https.createServer({
  cert: fs.readFileSync("localhost.pem"),
  key: fs.readFileSync("localhost-key.pem"),
});

const wss = new WebSocket.Server({ server });

let vrClient = null;
let annotationClient = null;

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    console.log("Server got:", data.type);

    if (data.type === "register") {
      if (data.role === "vr") {
        vrClient = ws;
        console.log("✅ VR client registered");
      }
      if (data.role === "annotation") {
        annotationClient = ws;
        console.log("✅ Annotation client registered");
      }
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
    if (data.type === "annotation" && vrClient) {
      vrClient.send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    if (ws === vrClient) vrClient = null;
    if (ws === annotationClient) annotationClient = null;
  });
});

// Start HTTPS + WSS server
server.listen(8080, () => {
  console.log("🚀 WebSocket signaling server running on wss://localhost:8080");
});
