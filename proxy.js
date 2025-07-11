// proxy.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const DROPBOX_FOLDER = process.env.DROPBOX_FOLDER || ''; // Ví dụ: '' hoặc '/IFCEXPORT'

app.use(cors());

// 🔁 Lấy danh sách tất cả file IFC
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
    console.log("📦 Dropbox trả về:", JSON.stringify(data, null, 2));

    if (!data.entries) {
      return res.status(500).json({
        error: 'Dropbox API không trả về danh sách file. Kiểm tra token hoặc đường dẫn.',
        raw: data,
      });
    }

    const files = data.entries
      .filter(e => e.name.endsWith('.ifc'))
      .map(e => e.name);

    if (!files.length) {
      return res.status(404).json({ error: 'Không có file IFC nào trong thư mục Dropbox.' });
    }

    res.json(files);
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách file:', err);
    res.status(500).json({ error: 'Lỗi server khi gọi Dropbox.' });
  }
});

// 🔁 Lấy file IFC cụ thể
app.get('/download-ifc', async (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).send('Thiếu tên file');

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
      console.error("❌ Lỗi Dropbox khi tải file:", error);
      return res.status(500).send("Không thể tải file từ Dropbox");
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('❌ Lỗi khi tải file:', err);
    res.status(500).send('Lỗi server nội bộ');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server đang chạy tại http://localhost:${PORT}`);
});
