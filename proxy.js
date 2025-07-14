// proxy.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { Buffer } from "buffer";

const app = express();

// ✅ Cho phép mọi frontend truy cập
app.use(cors({ origin: "*" }));

// 🔑 Cấu hình Nextcloud public folder
const SHARE_TOKEN = "yiaztqQzYbTkecz"; // token trong URL: /s/yiaztqQzYbTkecz
const PASSWORD = "180523bimtech";      // mật khẩu chia sẻ thư mục
const WEBDAV_URL = `https://bimtechcloud.ddns.net/public.php/webdav/`;

// ✅ Tạo header xác thực basic auth với mật khẩu
const AUTH_HEADER = "Basic " + Buffer.from(":" + PASSWORD).toString("base64");

// 🧾 API: Lấy danh sách file .IFC
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

    // Lấy danh sách file .ifc từ XML
    const files = [...xml.matchAll(/<d:href>.*?([^\/]+\.ifc)<\/d:href>/g)].map(
      (m) => decodeURIComponent(m[1])
    );

    res.json({ files });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách file IFC:", err);
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

    res.setHeader("Content-Type", "application/octet-stream");
    response.body.pipe(res);
  } catch (err) {
    console.error("Lỗi khi tải file:", err);
    res.status(500).send("Không thể tải file IFC");
  }
});

// 🚀 Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Proxy đang chạy tại http://localhost:${PORT}`)
);
app.get("/list-ifc", async (req, res) => {
  try {
    const props = await fetch(WEBDAV_URL, {
      method: "PROPFIND",
      headers: { Authorization: AUTH_HEADER, Depth: "1" }
    });
    const xml = await props.text();

    console.log("🧾 XML PROPFIND response:\n", xml); // Log XML

    const files = [...xml.matchAll(/<d:href>.*?([^\/]+\.ifc)<\/d:href>/gi)]
      .map(m => decodeURIComponent(m[1]));
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không lấy được danh sách IFC" });
  }
});
