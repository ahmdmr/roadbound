const express = require('express');
const basicAuth = require('express-basic-auth');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 1. Middleware: This allows your server to understand JSON data sent from the admin page
app.use(express.json());
app.use('/admin.html', basicAuth({
  users: { 'admin': process.env.ADMIN_PASSWORD || 'changeme123' },
  challenge: true
}));
app.use(express.static(__dirname));

async function setupDatabase() {
  // Create the table if it doesn't exist yet
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fleet (
      car_name TEXT PRIMARY KEY,
      available BOOLEAN
    )
  `);

  // Check if it's empty, and if so, insert your starting fleet
  const result = await pool.query('SELECT COUNT(*) FROM fleet');
  if (result.rows[0].count === '0') {
    const startingFleet = {
      "City Hatch": true,
      "Highway Sedan": false,
      "Trailhead SUV": true,
      "Backroad Pickup": true,
      "Coastline Convertible": false,
      "Family Minivan": true,
      "Volt Electric": true
    };
    for (const [name, available] of Object.entries(startingFleet)) {
      await pool.query('INSERT INTO fleet (car_name, available) VALUES ($1, $2)', [name, available]);
    }
    console.log('Database seeded with starting fleet.');
  }
}

app.get('/api/fleet', async (req, res) => {
  const result = await pool.query('SELECT car_name, available FROM fleet');
  const fleetData = {};
  result.rows.forEach(row => {
    fleetData[row.car_name] = row.available;
  });
  res.json(fleetData);
});

app.post('/api/fleet/toggle', async (req, res) => {
  const carName = req.body.carName;

  const check = await pool.query('SELECT available FROM fleet WHERE car_name = $1', [carName]);
  if (check.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Car not found" });
  }

  const newStatus = !check.rows[0].available;
  await pool.query('UPDATE fleet SET available = $1 WHERE car_name = $2', [newStatus, carName]);
  console.log(`Updated: ${carName} is now ${newStatus ? 'Available' : 'Booked'}`);
  res.json({ success: true });
});

// 6. Start the engine
setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
});