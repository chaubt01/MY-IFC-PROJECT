import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const DROPBOX_API = 'https://api.dropboxapi.com/2';
const DROPBOX_CONTENT = 'https://content.dropboxapi.com/2';
const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const DROPBOX_PATH = process.env.DROPBOX_PATH || '';

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${DROPBOX_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// API: /latest-ifc → trả về tên file mới nhất
app.get('/latest-ifc', async (req, res) => {
  try {
    const result = await fetch(`${DROPBOX_API}/files/list_folder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path: DROPBOX_PATH, recursive: false }),
    });

    const json = await result.json();
    if (!json.entries) throw new Error("Không có dữ liệu trả về");

    const ifcFiles = json.entries
      .filter(f => f.name.match(/^fileifc_\d{8}_\d{6}\.ifc$/i))
      .sort((a, b) => b.name.localeCompare(a.name))
      .reverse();

    if (ifcFiles.length === 0) return res.status(404).send("Không tìm thấy file IFC");

    res.send(ifcFiles[0].name);
  } catch (err) {
    console.error("❌ /latest-ifc:", err);
    res.status(500).send("Lỗi khi lấy file mới nhất");
  }
});

// API: /download-ifc?file=... → tải file IFC
app.get('/download-ifc', async (req, res) => {
  try {
    const fileName = req.query.file;
    if (!fileName) return res.status(400).send("Thiếu tên file");

    const path = `${DROPBOX_PATH}${fileName}`;
    const response = await fetch(`${DROPBOX_CONTENT}/files/download`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DROPBOX_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({ path }),
      },
    });

    if (!response.ok) throw new Error("Không tải được file");

    const buffer = await response.arrayBuffer();
    res.set('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("❌ /download-ifc:", err);
    res.status(500).send("Lỗi khi tải file");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server đang chạy tại http://localhost:${PORT}`);
});
