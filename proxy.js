import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { Buffer } from "buffer";

const app = express();

// ✅ Cho phép mọi frontend truy cập
app.use(cors({ origin: "*" }));

// 🔧 Xử lý preflight CORS cho mọi đường dẫn
app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

// 🔑 Cấu hình Nextcloud public folder
const shareToken = "yiaztqQzYbTkecz";
const WEBDAV_URL = "https://bimtechcloud.ddns.net/public.php/webdav/";
const PASSWORD = "180523bimtech";
const AUTH_HEADER =
  "Basic " + Buffer.from(shareToken + ":" + PASSWORD).toString("base64");

// 🧾 API: Lấy danh sách file IFC
app.get("/list-ifc", async (req, res) => {
  try {
    const response = await fetch(WEBDAV_URL, {
      method: "PROPFIND",
      headers: {
        Authorization: AUTH_HEADER,
        Depth: "1",
      },
    });

    const xml = await response.text();

    // Trích xuất danh sách file .ifc từ XML
    const files = [...xml.matchAll(/<d:href>.*?([^\/]+\.ifc)<\/d:href>/gi)].map(
      (m) => decodeURIComponent(m[1])
    );

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ files });
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách file IFC:", err);
    res.status(500).json({ error: "Không lấy được danh sách file" });
  }
});

// 📦 API: Tải file IFC theo tên
app.get("/download-ifc", async (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).send("Thiếu tên file");

  const fileUrl = WEBDAV_URL + encodeURIComponent(file);

  try {
    const response = await fetch(fileUrl, {
      headers: {
        Authorization: AUTH_HEADER,
      },
    });

    if (!response.ok) throw new Error("Không tải được file");

    // 🔧 Bổ sung header CORS trước khi stream
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/octet-stream");

    response.body.pipe(res);
  } catch (err) {
    console.error("❌ Lỗi khi tải file IFC:", err);
    res.status(500).send("Không thể tải file IFC");
  }
});

// 🚀 Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Proxy đang chạy tại http://localhost:${PORT}`)
);
