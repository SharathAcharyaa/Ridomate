const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ridesharing', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}); 

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

// Define Ride Schema
const rideSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    usn: String,
    pickup: String,
    drop: String,
    requestedAt: { type: Date, default: Date.now }
});

const Ride = mongoose.model('Ride', rideSchema);

// Define Notification Schema
const notificationSchema = new mongoose.Schema({
    sharerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rideRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/request', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'request.html'));
});

app.get('/share', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/notifications', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notifications.html'));
});

// User registration
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        res.status(500).send({ message: 'Error signing up', error });
    }
});

// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            res.redirect('/request');
        } else {
            res.status(400).send({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error logging in', error });
    }
});

// User logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Request a ride
app.post('/api/request-ride', async (req, res) => {
    const { name, usn, pickup, drop } = req.body;

    try {
        const ride = new Ride({ name, usn, pickup, drop });
        await ride.save();

        // Find matching ride sharers and create notifications
        const matchingSharers = await Ride.find({ pickup, drop });
        for (const sharer of matchingSharers) {
            const notification = new Notification({
                sharerId: sharer.userId,
                requesterId: req.session.userId,
                rideRequestId: ride._id
            });
            await notification.save();
        }

        res.status(201).send({ message: 'Ride requested successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error requesting ride', error });
    }
});

// Get notifications
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ sharerId: req.session.userId }).populate('requesterId rideRequestId');
        res.json(notifications);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching notifications', error });
    }
});

// Respond to notification
app.post('/api/notifications/:id/:action', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        notification.status = req.params.action === 'accept' ? 'accepted' : 'rejected';
        await notification.save();

        if (req.params.action === 'accept') {
            // Notify the requester (implement your notification logic here)
        }

        res.send(`Ride request ${req.params.action}ed.`);
    } catch (error) {
        res.status(500).send({ message: `Error responding to notification`, error });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
