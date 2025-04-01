const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Adding middleware to handle JSON
app.use(express.json());

// CORS settings
app.use(cors({
    origin: 'http://127.0.0.1:5500',  // Make sure to specify the correct port for Live Server
}));

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

// Registering a new user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const result = await client.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );
        res.json({ id: result.rows[0].id, username: result.rows[0].username });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user');
    }
});

// Authorization logic
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).send('User not found');
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).send('Invalid password');
        }

        // Token generation
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Error logging in');
    }
});

// Protected route for voting
app.post('/vote', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Example: 'Bearer <token>'
    
    if (!token) {
        return res.status(401).send('Access denied');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { party } = req.body;
        if (!party) {
            return res.status(400).send('Party is required');
        }

        // Check if the party exists in the database
        const partyCheck = await client.query('SELECT * FROM parties WHERE name = $1', [party]);
        if (partyCheck.rows.length === 0) {
            return res.status(400).send('Party not found');
        }

        // Check if the user has already voted
        const voteCheck = await client.query('SELECT * FROM votes WHERE user_id = $1', [userId]);

        if (voteCheck.rows.length > 0) {
            return res.status(400).json({ message: 'You have already voted' });
        }

        // Record the vote in the database
        await client.query(
            'INSERT INTO votes (user_id, party) VALUES ($1, $2)',
            [userId, party]
        );

        res.json({ message: 'Vote successfully recorded' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing vote');
    }
});

// Starting the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});