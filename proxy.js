import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { Buffer } from "buffer";

const app = express();
app.use(cors({ origin: "*" }));

const WEBDAV_URL = "https://bimtechcloud.ddns.net/public.php/webdav/";
const PASSWORD = "180523bimtech";
const AUTH_HEADER = "Basic " + Buffer.from(":" + PASSWORD).toString("base64");

// List file IFC
app.get("/list-ifc", async (req, res) => {
  try {
    const props = await fetch(WEBDAV_URL, {
      method: "PROPFIND",
      headers: { Authorization: AUTH_HEADER, Depth: "1" }
    });
    const xml = await props.text();
    const files = [...xml.matchAll(/<d:href>.*?([^\/]+\.ifc)<\/d:href>/g)].map(m => decodeURIComponent(m[1]));
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không lấy được danh sách IFC" });
  }
});

// Download IFC
app.get("/download-ifc", async (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).send("Thiếu tên file");

  const url = WEBDAV_URL + encodeURIComponent(file);
  try {
    const fw = await fetch(url, { headers: { Authorization: AUTH_HEADER } });
    if (!fw.ok) throw new Error("Không tải được file");
    res.setHeader("Content-Type", "application/octet-stream");
    fw.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi tải IFC");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy chạy tại port ${PORT}`);
});
