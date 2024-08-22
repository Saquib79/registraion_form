const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = "mongodb+srv://mdsaquibansari7979:saquib7979@registration-form-db.q8cry.mongodb.net/registration-form-db";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    mobile: Number,
    email: String,
    street: String,
    city: String,
    state: String,
    country: String,
    loginId: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

app.get('/users', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'users.html');
    console.log('Attempting to serve:', filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error loading users page');
        }
    });
});

app.get('/users', (req, res) => {
    app.get('/users', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'users.html'));
    });
});

app.post('/submit_registration', async (req, res) => {
    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        mobile: req.body.mobile,
        email: req.body.email,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        loginId: req.body['login-id'],
        password: req.body.password,
    });

    try {
        await newUser.save();
        console.log('User registered successfully');
        res.status(200).send('User registered successfully!');
    } catch (err) {
        console.error('Error registering new user:', err);
        res.status(500).send('Error registering new user.');
    }
});

app.get('/user/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (user) {
            res.json(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).send('Error fetching user data');
    }
});

const liveUsers = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (userData) => {
        socket.join('live users');
        liveUsers.set(socket.id, { email: userData.email, name: userData.name });
        io.to('live users').emit('userList', Array.from(liveUsers.values()));
    });

    socket.on('disconnect', () => {
        liveUsers.delete(socket.id);
        io.to('live users').emit('userList', Array.from(liveUsers.values()));
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});