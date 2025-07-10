// proxy.js (dùng ES Modules)
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const DROPBOX_FOLDER = '/Apps/IFCEXPORT'; // thư mục gốc bạn lưu file .ifc

app.use(cors());

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
    console.error(err);
    res.status(500).send('Error fetching IFC list');
  }
});

app.get('/download-ifc', async (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).send('Missing file');

  try {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({ path: `${DROPBOX_FOLDER}/${file}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dropbox Error:", errorText);
      return res.status(500).send('Error downloading file from Dropbox');
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
