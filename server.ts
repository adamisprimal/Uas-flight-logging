import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("drone_logs.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS drones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    total_flight_time INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drone_id INTEGER,
    pilot_name TEXT NOT NULL,
    date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    location TEXT,
    purpose TEXT,
    notes TEXT,
    FOREIGN KEY (drone_id) REFERENCES drones(id)
  );

  CREATE TABLE IF NOT EXISTS checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id INTEGER,
    type TEXT NOT NULL, -- 'pre-flight', 'post-flight'
    items TEXT NOT NULL, -- JSON string
    FOREIGN KEY (flight_id) REFERENCES flights(id)
  );
`);

// Seed initial data if empty
const droneCount = db.prepare("SELECT COUNT(*) as count FROM drones").get() as { count: number };
if (droneCount.count === 0) {
  db.prepare("INSERT INTO drones (name, model, serial_number) VALUES (?, ?, ?)").run("Alpha-1", "DJI Mavic 3 Pro", "SN12345678");
  db.prepare("INSERT INTO drones (name, model, serial_number) VALUES (?, ?, ?)").run("Beta-2", "DJI Air 3", "SN87654321");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/drones", (req, res) => {
    const drones = db.prepare("SELECT * FROM drones").all();
    res.json(drones);
  });

  app.post("/api/drones", (req, res) => {
    const { name, model, serial_number } = req.body;
    const result = db.prepare("INSERT INTO drones (name, model, serial_number) VALUES (?, ?, ?)").run(name, model, serial_number);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/flights", (req, res) => {
    const flights = db.prepare(`
      SELECT f.*, d.name as drone_name 
      FROM flights f 
      JOIN drones d ON f.drone_id = d.id 
      ORDER BY date DESC
    `).all();
    res.json(flights);
  });

  app.post("/api/flights", (req, res) => {
    const { drone_id, pilot_name, date, duration_minutes, location, purpose, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO flights (drone_id, pilot_name, date, duration_minutes, location, purpose, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(drone_id, pilot_name, date, duration_minutes, location, purpose, notes);
    
    // Update drone total flight time
    db.prepare("UPDATE drones SET total_flight_time = total_flight_time + ? WHERE id = ?").run(duration_minutes, drone_id);
    
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/stats", (req, res) => {
    const totalFlights = db.prepare("SELECT COUNT(*) as count FROM flights").get() as { count: number };
    const totalDuration = db.prepare("SELECT SUM(duration_minutes) as total FROM flights").get() as { total: number };
    const droneStats = db.prepare(`
      SELECT d.name, COUNT(f.id) as flight_count, SUM(f.duration_minutes) as total_time
      FROM drones d
      LEFT JOIN flights f ON d.id = f.drone_id
      GROUP BY d.id
    `).all();
    
    res.json({
      totalFlights: totalFlights.count,
      totalDuration: totalDuration.total || 0,
      droneStats
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
