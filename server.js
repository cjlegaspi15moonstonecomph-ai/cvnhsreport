const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Setup SQLite database
const db = new sqlite3.Database('reports.db', err => {
  if (err) console.error("DB Error:", err);
});

db.run(`CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  location TEXT,
  type TEXT,
  otherType TEXT,
  grade TEXT,
  description TEXT,
  bully TEXT,
  reporter TEXT,
  file_path TEXT,
  status TEXT DEFAULT 'Start'
)`);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Submit report
app.post('/submit-report', upload.single('proof'), (req, res) => {
  const { date, location, type, otherType, grade, description, bully, reporter } = req.body;
  const file_path = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO reports (date, location, type, otherType, grade, description, bully, reporter, file_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date, location, type, otherType, grade, description, bully, reporter, file_path],
    function(err) {
      if (err) {
        console.error("Error saving report:", err);
        return res.status(500).send("Error saving report.");
      }
      res.send("Report submitted successfully!");
    }
  );
});

// Admin login
app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Get all reports
app.get('/get-reports', (req, res) => {
  db.all('SELECT * FROM reports', [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

// Delete report
app.delete('/delete-report/:id', (req, res) => {
  const id = req.params.id;
  // Get file_path first to delete uploaded file
  db.get('SELECT file_path FROM reports WHERE id = ?', [id], (err, row) => {
    if (row && row.file_path) {
      const file = path.join(__dirname, 'uploads', row.file_path);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    db.run('DELETE FROM reports WHERE id = ?', [id], err => {
      if (err) return res.status(500).send("Error deleting report.");
      res.send("Report deleted successfully.");
    });
  });
});

// Update status
app.put('/update-status/:id', (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  db.run('UPDATE reports SET status = ? WHERE id = ?', [status, id], err => {
    if (err) return res.status(500).send("Error updating status.");
    res.send("Status updated.");
  });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
