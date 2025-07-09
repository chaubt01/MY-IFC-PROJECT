// proxy/server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const token = "EFyP8JafKFSQE26";
const password = "bimtech.vn";
const baseUrl = "http://192.168.1.9:30027/public.php/webdav/";

app.get("/latest-ifc", async (req, res) => {
  const response = await fetch(baseUrl, {
    method: "PROPFIND",
    headers: {
      Authorization: "Basic " + Buffer.from(`${token}:${password}`).toString("base64"),
      Depth: "1",
    },
  });
  const xml = await response.text();
  res.send(xml);
});

app.get("/download-ifc", async (req, res) => {
  const file = req.query.file;
  const response = await fetch(baseUrl + file, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${token}:${password}`).toString("base64"),
    },
  });
  const buffer = await response.arrayBuffer();
  res.setHeader("Content-Type", "application/octet-stream");
  res.send(Buffer.from(buffer));
});

app.listen(3001, () => {
  console.log("🚀 Proxy running at http://localhost:3001");
});
