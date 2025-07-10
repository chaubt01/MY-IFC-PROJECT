// proxy.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const DROPBOX_FOLDER = '/Apps/IFCEXPORT'; // Đường dẫn thư mục Dropbox chứa file IFC

app.use(cors());

// 1. Trả về tên file IFC mới nhất
app.get('/latest-ifc', async (req, res) => {
  try {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: DROPBOX_FOLDER,
        recursive: false,
      }),
    });

    const data = await response.json();
    const files = data.entries.filter(e => e.name.endsWith('.ifc'));

    if (!files.length) return res.status(404).send('No IFC files found');

    const latest = files.sort((a, b) => new Date(b.client_modified) - new Date(a.client_modified))[0];
    res.send(latest.name);
  } catch (err) {
    console.error("❌ Lỗi lấy file mới nhất:", err);
    res.status(500).send('Error fetching IFC list');
  }
});

// 2. Trả về nội dung file IFC (buffer)
app.get('/download-ifc', async (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).send('Missing file name');

  try {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({ path: `${DROPBOX_FOLDER}/${file}` }),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Dropbox lỗi:", error);
      return res.status(500).send("Error downloading file from Dropbox");
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("❌ Lỗi khi download file:", err);
    res.status(500).send('Internal server error');
  }
});

// 3. Trả về danh sách tất cả file IFC
app.get('/list-ifc', async (req, res) => {
  try {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: DROPBOX_FOLDER,
        recursive: false,
      }),
    });

    const data = await response.json();
    const ifcFiles = data.entries
      .filter(e => e[".tag"] === "file" && e.name.endsWith(".ifc"))
      .map(e => e.name);

    res.json(ifcFiles);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách file:", err.message);
    res.status(500).send("Error getting IFC list");
  }
});

// 4. Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server đang chạy tại http://localhost:${PORT}`);
});
