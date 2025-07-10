// proxy.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const DROPBOX_API = "https://content.dropboxapi.com/2/files/download";

app.get("/download-ifc", async (req, res) => {
  const fileName = req.query.file;
  if (!fileName) return res.status(400).send("Thiếu tên file");

  try {
    const response = await fetch(DROPBOX_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: `/Apps/IFCEXPORT/${fileName}`
        })
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Dropbox error:", text);
      return res.status(500).send("Dropbox error: " + text);
    }

    const data = await response.arrayBuffer();
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(Buffer.from(data));
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).send("Lỗi server");
  }
});

app.get("/latest-ifc", async (req, res) => {
  try {
    const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "/Apps/IFCEXPORT",
        recursive: false
      })
    });

    const json = await response.json();
    if (!json.entries) throw new Error("Không tìm thấy danh sách file");

    const ifcFiles = json.entries
      .map(e => e.name)
      .filter(name => /fileifc_\d{8}_\d{6}\.ifc$/i.test(name))
      .sort()
      .reverse();

    if (ifcFiles.length === 0) return res.status(404).send("Không tìm thấy file IFC");

    res.send(ifcFiles[0]);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách:", err);
    res.status(500).send("Lỗi server");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy đang chạy ở cổng ${PORT}`);
});
