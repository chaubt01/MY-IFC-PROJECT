// proxy.js (hoạt động tốt trên Render)
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const DROPBOX_API = "https://content.dropboxapi.com/2/files/download";

// Tải file IFC mới nhất từ Dropbox
app.get("/latest-ifc", async (req, res) => {
  try {
    const result = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: "/Apps/IFCEXPORT",
        recursive: false
      })
    });

    const json = await result.json();
    const latest = json.entries
      .filter(e => e.name.endsWith(".ifc"))
      .sort((a, b) => b.client_modified.localeCompare(a.client_modified))[0];

    if (!latest) return res.status(404).send("Không tìm thấy file");

    res.send(latest.name);
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi lấy danh sách file từ Dropbox");
  }
});

// Tải nội dung file cụ thể
app.get("/download-ifc", async (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).send("Thiếu tên file");

  try {
    const result = await fetch(DROPBOX_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: `/Apps/${file}`
        })
      }
    });

    if (!result.ok) {
      const errText = await result.text();
      console.error(errText);
      return res.status(500).send("Lỗi tải file từ Dropbox");
    }

    const data = await result.arrayBuffer();
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(Buffer.from(data));
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Proxy đang chạy tại cổng ${PORT}`));
