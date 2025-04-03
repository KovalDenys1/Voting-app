const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).send('Username, password, and email are required');
    }

    try {
        // Check if the username already exists
        const userCheck = await client.query('SELECT * FROM users WHERE username = $1', [username]);

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const result = await client.query(
            'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, hashedPassword, email]
        );

        res.json({ id: result.rows[0].id, username: result.rows[0].username, email: result.rows[0].email });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user');
    }
});

// Forgot password logic
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        const user = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(400).send('No user found with that email');
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expiration = Date.now() + 3600000;  // 1 hour expiration

        // Save the token and expiration time in the database
        await client.query(
            'UPDATE users SET reset_token = $1, reset_token_expiration = $2 WHERE email = $3',
            [token, expiration, email]
        );

        // Send an email with the reset password link
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,  // Gmail email address
                pass: process.env.GMAIL_APP_PASSWORD,  // App Password
            },
            tls: {
                rejectUnauthorized: true,  // Ensure SSL validation
            },
        });

        const resetLink = `http://localhost:5000/reset-password/${token}`;
        await transporter.sendMail({
            to: email,
            subject: 'Password Reset',
            text: `Click the following link to reset your password: ${resetLink}`,
        });

        res.send('Password reset email sent');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error sending password reset email');
    }
});

// Reset password logic
app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).send('Password is required');
    }

    try {
        const user = await client.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiration > $2',
            [token, Date.now()]
        );

        if (user.rows.length === 0) {
            return res.status(400).send('Invalid or expired token');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the password and clear the reset token
        await client.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiration = NULL WHERE reset_token = $2',
            [hashedPassword, token]
        );

        res.send('Password successfully reset');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error resetting password');
    }
});

// Authorization logic
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Token generation
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Error logging in' });
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

// Get voting results with LEFT JOIN to include parties with 0 votes
app.get('/results', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT parties.name AS party, COUNT(votes.party) AS votes
            FROM parties
            LEFT JOIN votes ON parties.name = votes.party
            GROUP BY parties.name
            ORDER BY votes DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching results');
    }
});

// Starting the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Get list of parties
app.get('/parties', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM parties');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching parties');
    }
});