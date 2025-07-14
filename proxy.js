import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());

const IFC_DIR = path.resolve("public/ifc");

app.get("/list-ifc", (req, res) => {
  fs.readdir(IFC_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: "Không đọc được thư mục" });
    res.json({ files: files.filter(f => f.endsWith(".ifc")) });
  });
});

app.get("/download-ifc", (req, res) => {
  const file = req.query.file;
  const filePath = path.join(IFC_DIR, file);
  if (!fs.existsSync(filePath)) return res.status(404).send("Không tìm thấy file");
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Proxy server tại http://localhost:${PORT}`));
