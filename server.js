const express = require('express');
const basicAuth = require('express-basic-auth');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware: This allows your server to understand JSON data sent from the admin page
app.use(express.json());
app.use('/admin.html', basicAuth({
  users: { 'admin': process.env.ADMIN_PASSWORD || 'changeme123' },
  challenge: true
}));
app.use(express.static(__dirname));

// 3. Our "Database" 
// For this step, we are storing the data in the server's memory. 
let fleetData = {
  "City Hatch": true,
  "Highway Sedan": false,
  "Trailhead SUV": true,
  "Backroad Pickup": true,
  "Coastline Convertible": false,
  "Family Minivan": true,
  "Volt Electric": true
};

// 4. API Endpoint (READ)
// When index.html or admin.html asks for data, send them the fleetData object
app.get('/api/fleet', (req, res) => {
  res.json(fleetData);
});

// 5. API Endpoint (UPDATE)
// When admin.html sends a request to change a status, update the database
app.post('/api/fleet/toggle', (req, res) => {
  const carName = req.body.carName; // Grab the car name sent from the admin page

  // If the car exists in our database, flip its true/false status
  if (fleetData[carName] !== undefined) {
    fleetData[carName] = !fleetData[carName]; 
    console.log(`Updated: ${carName} is now ${fleetData[carName] ? 'Available' : 'Booked'}`);
    res.json({ success: true, newData: fleetData });
  } else {
    res.status(404).json({ success: false, message: "Car not found" });
  }
});

// 6. Start the engine
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});