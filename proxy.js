const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;
const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const DROPBOX_FOLDER = process.env.DROPBOX_FOLDER || "";

app.use(cors());

app.get("/list-ifc", async (req, res) => {
  try {
    const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: DROPBOX_FOLDER,
      }),
    });

    const data = await response.json();
    const files = data.entries
      .filter(entry => entry[".tag"] === "file" && entry.name.endsWith(".ifc"))
      .map(entry => entry.name)
      .sort()
      .reverse();

    res.json(files);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách file:", err);
    res.status(500).send("Lỗi khi lấy danh sách file");
  }
});

app.get("/download-ifc", async (req, res) => {
  const fileName = req.query.file;
  if (!fileName) return res.status(400).send("Thiếu tên file");

  try {
    const response = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: `${DROPBOX_FOLDER}/${fileName}`,
        }),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    response.body.pipe(res);
  } catch (err) {
    console.error("Lỗi khi tải file:", err);
    res.status(500).send("Lỗi khi tải file");
  }
});

app.listen(port, () => {
  console.log(`🚀 Proxy server đang chạy tại http://localhost:${port}`);
});
