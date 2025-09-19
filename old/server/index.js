const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

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

console.log("🚀 WebSocket signaling server running on ws://0.0.0.0:8080");
