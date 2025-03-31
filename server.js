const express = require('express');
const { Client } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');  // Importing cors

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS for requests from port 5500 (Live Server)
app.use(cors({
    origin: 'http://127.0.0.1:5500', // or 'http://localhost:5500'
}));

// Create a database connection
const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));

// Middleware for parsing JSON
app.use(express.json());

// Route for getting votes
app.get('/votes', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM votes');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving votes');
    }
});

// Route for voting
app.post('/vote', async (req, res) => {
    const { party } = req.body;
    if (!party) {
        return res.status(400).send('Party is required');
    }

    try {
        const result = await client.query(
            'UPDATE votes SET votes_count = votes_count + 1 WHERE party = $1 RETURNING *',
            [party]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing vote');
    }
});

// Route to reset votes
app.post('/reset', async (req, res) => {
    try {
        await client.query('UPDATE votes SET votes_count = 0');
        res.send('Votes have been reset');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error resetting votes');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});