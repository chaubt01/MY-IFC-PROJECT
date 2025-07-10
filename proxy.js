// === proxy.js (Node.js - chạy trên Render) ===

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

// Token truy cập Dropbox (lấy từ Dropbox App Console)
const DROPBOX_TOKEN = 'YOUR_DROPBOX_TOKEN';
const DROPBOX_FOLDER_PATH = '/ifc-files'; // Thư mục chứa file IFC trên Dropbox

app.use(cors());

// Trả danh sách file IFC
app.get('/list-ifc', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.dropboxapi.com/2/files/list_folder',
      { path: DROPBOX_FOLDER_PATH },
      {
        headers: {
          Authorization: `Bearer ${DROPBOX_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const files = response.data.entries
      .filter(entry => entry.name.endsWith('.ifc'))
      .map(entry => entry.name);

    res.json(files);
  } catch (err) {
    console.error("Lỗi lấy danh sách file:", err.response?.data || err.message);
    res.status(500).send("Không thể lấy danh sách file");
  }
});

// Tải file IFC từ Dropbox theo tên
app.get('/download-ifc', async (req, res) => {
  const fileName = req.query.file;
  if (!fileName) return res.status(400).send("Thiếu tên file");

  try {
    const response = await axios.post(
      'https://content.dropboxapi.com/2/files/download',
      null,
      {
        headers: {
          Authorization: `Bearer ${DROPBOX_TOKEN}`,
          'Dropbox-API-Arg': JSON.stringify({ path: `${DROPBOX_FOLDER_PATH}/${fileName}` })
        },
        responseType: 'arraybuffer'
      }
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(response.data);
  } catch (err) {
    console.error("Lỗi tải file:", err.response?.data || err.message);
    res.status(500).send("Không thể tải file IFC");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy đang chạy tại http://localhost:${PORT}`);
});
