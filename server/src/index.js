require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded profile photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API mounting
app.use('/api', apiRoutes);

// Health check / welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DevTask API server' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
