
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const WebSocket = require('ws');
const nodemailer = require('nodemailer');

// Initialize Express application
const app = express();
const PORT = 3000; 

app.use(express.json());

// Connect to the MongoDB database
mongoose.connect('mongodb://localhost:27017/userLoginAnalysis', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define User Schema with Roles
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
});

const loginSchema = new mongoose.Schema({
    username: String,
    loginTime: Date,
    location: String,
    isAnomaly: { type: Boolean, default: false },
});

const User = mongoose.model('User', userSchema);
const Login = mongoose.model('Login', loginSchema);

// Initialize WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New client connected');
});

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, 'secretkey', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; 
        next(); 
    });
};

// User Registration Endpoint
app.post('/register', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
        username: req.body.username,
        password: hashedPassword,
        role: req.body.role
    });

    try {
        await newUser.save(); 
        res.status(201).send('User Registered');
    } catch {
        res.status(400).send('User already exists');
    }
});

// User Login Endpoint
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ username: user.username, role: user.role }, 'secretkey');
    res.json({ token });
});

// Log Login Event Endpoint
app.post('/login-event', authenticateToken, async (req, res) => {
    const { username, location } = req.body;
    const loginTime = new Date();
    const newLogin = new Login({ username, loginTime, location });
    await newLogin.save();

    if (location !== 'expected location') {
        newLogin.isAnomaly = true;
        await newLogin.save();
        sendNotification(username, 'Anomaly detected in your login attempt.');
    }

    // Broadcast login event to all connected WebSocket clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ username, loginTime, isAnomaly: newLogin.isAnomaly }));
        }
    });

    res.status(201).send('Login event recorded');
});

// Function to send notification emails
function sendNotification(username, message) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com', 
            pass: 'your-email-password', 
        },
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: username,
        subject: 'Login Alert',
        text: message,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

// Get Login Events Endpoint
app.get('/login-events', authenticateToken, async (req, res) => {
    const events = await Login.find({ username: req.user.username });
    res.json(events);
});

// User Role Management Endpoint
app.put('/update-role/:username', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied');
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { username: req.params.username }, 
            { role: req.body.role }, 
            { new: true }
        );
        res.json(updatedUser);
    } catch (error) {
        res.status(400).send('User not found');
    }
});

app.get('/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied');
    }

    const users = await User.find();
    res.json(users);
});

// Start the server and listen on specified port
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
