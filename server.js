const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// SQLite DB
const DB_FILE = path.join(__dirname, 'reports.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if(err) console.error(err);
  else console.log("Connected to SQLite");
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Submit report
app.post('/submit-report', upload.single('proof'), (req, res) => {
  const { date, location, type, otherType, grade, description, bully, reporter } = req.body;
  const file_path = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO reports 
      (date, location, type, otherType, grade, description, bully, reporter, file_path, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date||'-', location||'-', type||'Not specified', otherType||'-', grade||'-', description||'-', bully||'-', reporter||'-', file_path, 'Start'],
    function(err){
      if(err){
        console.error("Error saving report:", err.message);
        return res.status(500).send("Error saving report: " + err.message);
      }
      res.send("Report submitted successfully!");
    }
  );
});

// Admin login
app.post('/admin-login', (req,res)=>{
  const { username, password } = req.body;
  if(username===ADMIN_USER && password===ADMIN_PASS) res.json({success:true});
  else res.json({success:false});
});

// Get all reports
app.get('/get-reports', (req,res)=>{
  db.all('SELECT * FROM reports', [], (err, rows)=>{
    if(err){ console.error(err); return res.status(500).json([]); }
    res.json(rows);
  });
});

// Delete report
app.delete('/delete-report/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM reports WHERE id = ?`, [id], function(err){
    if(err){
      console.error("Delete error:", err.message);
      return res.status(500).json({success:false, message: err.message});
    }
    if(this.changes === 0){
      return res.status(404).json({success:false, message: "Report not found"});
    }
    res.json({success:true});
  });
});


// Update status
app.put('/update-status/:id', (req,res)=>{
  const { id } = req.params;
  const { status } = req.body;
  db.run(`UPDATE reports SET status=? WHERE id=?`, [status,id], function(err){
    if(err) return res.status(500).json({success:false, message: err.message});
    res.json({success:true});
  });
});

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));
