import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// Cho phép CORS
app.use(cors());

// __dirname với ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trả về tên file IFC mới nhất
app.get('/latest-ifc', async (req, res) => {
  try {
    const response = await fetch(`https://api.dropboxapi.com/2/files/list_folder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DROPBOX_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/Apps/IFCEXPORT',
      }),
    });

    const data = await response.json();

    const ifcFiles = data.entries
      .filter(f => f.name.endsWith('.ifc'))
      .sort((a, b) => b.client_modified.localeCompare(a.client_modified));

    if (ifcFiles.length === 0) return res.status(404).send("Không có file IFC nào");

    return res.send(ifcFiles[0].name);
  } catch (e) {
    console.error('❌ Lỗi khi lấy file mới nhất:', e);
    res.status(500).send('Lỗi server');
  }
});

// Trả file IFC theo tên
app.get('/download-ifc', async (req, res) => {
  const fileName = req.query.file;
  if (!fileName) return res.status(400).send("Thiếu tên file");

  try {
    const response = await fetch(`https://content.dropboxapi.com/2/files/download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DROPBOX_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: `/Apps/IFCEXPORT/${fileName}`,
        }),
      },
    });

    if (!response.ok) return res.status(500).send("Tải file thất bại");

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.body.pipe(res);
  } catch (e) {
    console.error('❌ Lỗi khi tải file:', e);
    res.status(500).send('Lỗi server');
  }
});

app.listen(port, () => {
  console.log(`🚀 Proxy server đang chạy tại http://localhost:${port}`);
});
