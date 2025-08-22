const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4100;

// ensure uploads & frames dirs exist
const uploadsDir = path.join(__dirname, "uploads");
const framesDir = path.join(__dirname, "public", "frames");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

// Multer storage (uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// Multer storage (frames)
const frameStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, framesDir), // <- sửa đây
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, Date.now() + ext);
  },
});

const uploadFrame = multer({ storage: frameStorage });

// Static files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use("/frames", express.static(framesDir));


// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Upload ảnh người dùng
app.post("/upload", upload.single("image"), (req, res) => {
  res.json({ imageUrl: "/uploads/" + req.file.filename });
});

// Upload frame
app.post("/upload-frame", uploadFrame.single("frame"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Không có file" });
  res.json({ frameUrl: "/frames/" + req.file.filename });
});

// Lấy danh sách frames
// Lấy danh sách frames từ server
app.get("/frames", (req, res) => {
  fs.readdir(framesDir, (err, files) => {
    if (err) return res.status(500).json([]);

    // chỉ lấy file ảnh
    const images = files.filter(f =>
      /\.(png|jpe?g|webp)$/i.test(f)
    );

    res.json(images);
  });
});


// Xóa frame
app.delete("/delete-frame/:filename", (req, res) => {
  const filePath = path.join(framesDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
