// proxy.js

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 👇 Đảm bảo __dirname dùng được khi xài ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Bật CORS cho tất cả origin
app.use(cors({ origin: "*" }));

// ✅ Đảm bảo thư mục chứa file IFC tồn tại
const IFC_DIR = path.join(__dirname, "public", "ifc");

// API: Lấy danh sách file IFC
app.get("/list-ifc", (req, res) => {
  fs.readdir(IFC_DIR, (err, files) => {
    if (err) {
      console.error("❌ Không đọc được thư mục IFC:", err);
      return res.status(500).json({ error: "Không đọc được thư mục IFC" });
    }

    const ifcFiles = files.filter(file => file.endsWith(".ifc"));
    res.json({ files: ifcFiles });
  });
});

// API: Tải file IFC
app.get("/download-ifc", (req, res) => {
  const file = req.query.file;
  if (!file || typeof file !== "string") {
    return res.status(400).send("Thiếu tên file");
  }

  const filePath = path.join(IFC_DIR, file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Không tìm thấy file");
  }

  res.sendFile(filePath);
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy server đang chạy tại PORT ${PORT}`);
  console.log(`🌍 Render URL: https://my-ifc-project.onrender.com`);
});
