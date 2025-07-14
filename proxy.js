import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 🛠 Xử lý __dirname cho ESM (nếu bạn dùng "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Khởi tạo app
const app = express();

// ✅ Bật CORS cho toàn bộ domain (hoặc bạn có thể chỉ định 1 domain nếu cần)
app.use(cors({ origin: "*" }));

// 📂 Đường dẫn chứa file IFC
const IFC_DIR = path.join(__dirname, "public", "ifc");

// 📄 API trả danh sách file .ifc
app.get("/list-ifc", (req, res) => {
  fs.readdir(IFC_DIR, (err, files) => {
    if (err) {
      console.error("❌ Lỗi đọc thư mục IFC:", err);
      return res.status(500).json({ error: "Không đọc được thư mục IFC" });
    }

    const ifcFiles = files.filter(f => f.endsWith(".ifc"));
    res.json({ files: ifcFiles });
  });
});

// 📥 API trả file IFC cụ thể
app.get("/download-ifc", (req, res) => {
  const file = req.query.file;

  // 🛡 Kiểm tra tham số
  if (!file || typeof file !== "string") {
    return res.status(400).send("Thiếu tên file");
  }

  const filePath = path.join(IFC_DIR, file);

  // 🛡 Không cho truy cập ra ngoài thư mục IFC
  if (!filePath.startsWith(IFC_DIR)) {
    return res.status(403).send("Truy cập bị từ chối");
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Không tìm thấy file");
  }

  res.sendFile(filePath);
});

// 🚀 Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy server đang chạy tại http://localhost:${PORT}`);
});
