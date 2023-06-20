require('dotenv').config();
const express = require('express')
const session = require('express-session')
const MongoDBStore = require('connect-mongo');
const cors = require('cors');
const { ensureAuthentication, localStrategy, session: passportSession } = require('./controllers/authController');
const connectToMongoDb = require('./controllers/mongoController');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const friendsRoutes = require('./routes/friendsRoutes')
const chatsRoutes = require('./routes/chatsRoutes')
const path = require('path');
const app = express()
const fs = require('fs');

const http = require('http').createServer(app);

const io = require('socket.io')(http, {
    cors: {
      origin: ["http://localhost:3000", "https://chatter-sphere.onrender.com"],
      methods: ["GET", "POST"],
      credentials: true
    }
});

app.locals.io = io;

const PORT = process.env.PORT || 5000;
app.use(cors({ origin: ["http://localhost:3000", "https://chatter-sphere.onrender.com"], credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'secret',
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
  resave: true,
  saveUninitialized: true,
  store: new MongoDBStore({
    mongoUrl: process.env.MONGODB_URL,
    collection: 'mySessions'
  })
}));
app.use(localStrategy) 
app.use(passportSession)
app.use(authRoutes);
app.use(chatsRoutes)
app.use(groupRoutes);
app.use(friendsRoutes)


connectToMongoDb()

io.on('connection', (socket) => {
    console.log('A user connected');
  
    // Join a room based on the chatId
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('joinUser', (userId) => {
        socket.join(userId);
    });
  
    // Handle sending and receiving messages
    socket.on('sendMessage', (data) => {
      const { chatId, message } = data;
      // Save the message to the database
  
    // Emit the message to all connected clients in the same room except the sender
      socket.broadcast.to(chatId).emit('messageReceived', message);
    });
  
    // Handle other events and message types
  
    // Disconnect event
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
});

app.use(express.static(path.join(__dirname, '../build')));
console.log("Build path:", path.join(__dirname, '../build'));

app.get('*', (req, res) => {
  console.log("Received request for", req.originalUrl);
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

fs.readdir(path.join(__dirname, '../build'), (err, files) => {
  console.log("Build directory contents:", files);
});
  
app.get('/', ensureAuthentication, (req, res) => {
    res.json(req.user)
})

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

