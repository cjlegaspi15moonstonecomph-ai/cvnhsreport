const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('reports.db');

const columns = [
  { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
  { name: 'date', type: 'TEXT' },
  { name: 'location', type: 'TEXT' },
  { name: 'type', type: "TEXT DEFAULT 'Not specified'" },
  { name: 'otherType', type: "TEXT DEFAULT '-'" },
  { name: 'grade', type: "TEXT DEFAULT '-'" },
  { name: 'description', type: 'TEXT' },
  { name: 'bully', type: 'TEXT' },
  { name: 'reporter', type: 'TEXT' },
  { name: 'file_path', type: 'TEXT' },
  { name: 'status', type: "TEXT DEFAULT 'Start'" }
];

// First create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT
)`, () => {
  // Check each column
  db.all(`PRAGMA table_info(reports)`, [], (err, rows) => {
    if(err) { console.error(err); db.close(); return; }
    const existingCols = rows.map(r => r.name);
    columns.forEach(col => {
      if(!existingCols.includes(col.name)){
        db.run(`ALTER TABLE reports ADD COLUMN ${col.name} ${col.type}`, err => {
          if(err) console.error(`Error adding column ${col.name}:`, err.message);
          else console.log(`Column ${col.name} added successfully.`);
        });
      }
    });
    db.close();
  });
});
