require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('./models/user')
const Chat = require('./models/chat');
const Message = require('./models/messages');
const cors = require('cors');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require('path');
const app = express()

const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
app.locals.io = io;

const mongoDbUrl = process.env.MONGODB_URL
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const connectToMongoDb = async () => {
    try {
        await mongoose.connect(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true })   
        console.log('connected to MongoDB')
        console.log('Current database:', mongoose.connection.db.databaseName);
    } catch (err) {
        console.log(err)
    }
}

connectToMongoDb()

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy({ usernameField: 'username', passReqToCallback: true }, async(req, username, password, done) => {
    try {
        const email = req.body.email; // Get the email from the request
        const userByUsername = await User.findOne({ username: username }); // Look for a user with the username
        const userByEmail = await User.findOne({ email: email }); // Look for a user with the email
        
        if (!userByEmail && !userByUsername) {
            return done(null, false, { message: "Incorrect email and username" });
        }

        if (!userByEmail) {
            return done(null, false, { message: "Incorrect email" });
        }

        if (!userByUsername) {
            return done(null, false, { message: "Incorrect username" });
        }

        if (userByEmail.id !== userByUsername.id) {
            return done(null, false, { message: "Email and username do not match the same user" });
        }

        bcrypt.compare(password, userByEmail.password, (err, res) => {
            if (err) {
                return done(err);
            }

            if (res) {
                // passwords match! log user in
                return done(null, userByEmail);
            } else {
                // passwords do not match!
                return done(null, false, { message: "Incorrect password" });
            }
        });
    } catch (err) {
        return done(err);
    }
}));



passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
        done(null, user)
    } catch (err) {
        done(err)
    }
})

const ensureAuthentication = ((req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.status(401).send('Unauthorized');
})

const ensureChatIsReal = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const chatId = req.params.chatId;
  
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).send({ message: `Chat not found` });
      }

      const userById = await User.findOne({ _id: userId.toString() });
      const chat = await Chat.findOne({ _id: chatId.toString() });
      if (!chat) return res.status(400).send({ message: `Chat not found` });
      if (chat.members.includes(userId) && !chat.isGroupChat) {
        const friendInChat = chat.members.find((member) => member.toString() !== userId.toString());
  
        if (userById.friends.includes(friendInChat.toString())) {
          return next();
        } else {
          return res.status(400).send({ message: `Chat found, but your not friends with the User` });
        }
      } else if (chat.isGroupChat && chat.members.includes(userId)) {
        return next();
      } else {
        return res.status(400).send({ message: `Chat found but your not in the group` });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server error" });
    }
  };
  

const s3Client = new S3Client({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const upload = multer();

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
        console.log(data)
      const { chatId, message } = data;
      console.log(message)
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
  
app.get('/', ensureAuthentication, (req, res) => {
    res.json(req.user)
})

app.get('/users/chats', async (req, res) => {
    try {
      const userId = req.user._id.toString();
      let chats = await Chat.find({ members: userId }).populate('members', 'username profilePicture friends');
  
      chats = chats.map(chat => {
        if (chat.isGroupChat) {
          // If it's a group chat, send chat details as is
          return chat;
        } else {
          // If it's a two-person chat, check if the user is friends with the other person
          const friend = chat.members.find(member => member.id !== userId);
  
          if (friend && friend.friends.includes(userId)) {
            // If the user is friends with the other person, include the chat with friend's details
            return {
              ...chat.toObject(),
              friend
            };
          } else {
            // If the user is not friends with the other person, exclude the chat
            return null;
          }
        }
      });
  
      // Remove any null entries (chats that were excluded)
      chats = chats.filter(chat => chat !== null);
  
      res.status(200).json(chats);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
  });
  

app.get('/chats/:chatId/messages', ensureChatIsReal, async (req, res) => {
    try {
        const chatId = req.params.chatId
        if (chatId) {
            const messages = await Message.find({ chat: chatId }).populate('sender', 'username profilePicture');
            res.status(200).json(messages);
        } else {
            res.status(400).send({ message: 'Chat Not Found!'})
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/create-group', upload.single('groupPicture'), async (req, res) => {
    try {
      const groupChatName = req.body.newGroupName;
      const groupPicture = req.file;
      console.log('group picture:', groupPicture)
      console.log('groupchat name:', groupChatName)
  
      // Handle the group picture if available
      if (groupPicture) {
        // Use the buffer property attached by multer
        const fileBuffer = groupPicture.buffer;
  
        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: new Date().toISOString().replace(/:/g, '-') + groupPicture.originalname,
          Body: fileBuffer,
        };
  
        await s3Client.send(new PutObjectCommand(uploadParams));
  
        const groupPictureUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
  
        // Save the group chat with the group picture
        const groupChat = new Chat({
          isGroupChat: true,
          chatName: groupChatName,
          members: req.user._id.toString(),
          isOwner: req.user._id.toString(),
          groupPicture: groupPictureUrl,
        });
  
        await groupChat.save();
  
        res.status(200).send({ message: 'Group Created!' });
      } else {
        // Save the group chat without a group picture
        const groupChat = new Chat({
          isGroupChat: true,
          chatName: groupChatName,
          members: req.user._id.toString(),
          isOwner: req.user._id.toString(),
        });
  
        await groupChat.save();
  
        res.status(200).send({ message: 'Group Created!' });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
  });
  

app.delete('/delete-group', async (req, res) => {
    try {
      if (req.body.currentChatId) {
        const chatId = req.body.currentChatId;
        const chat = await Chat.findOne({ _id: chatId });
        const memberIds = chat.members.map(member => member._id.toString());
        const deletedChat = await Chat.findOneAndDelete({ _id: chatId });
        if (chat.groupPicture) {
            const oldImageKey = chat.groupPicture.split('/').pop();
      
            const deleteParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: oldImageKey
            };
      
            await s3Client.send(new DeleteObjectCommand(deleteParams));
        }
        console.log(memberIds)
        if (deletedChat) {
          // Emit 'chatDeleted' event to all connected clients in the group chat
          await Message.deleteMany({ chat: chatId })
          io.to(chatId).emit('chatDeleted', chatId);
          io.to(memberIds).emit('chatDeletedMembers', chatId);
          res.status(200).json({ message: 'Chat deleted' });
        } else {
          res.status(404).json({ message: 'Chat not found' });
        }
      } else {
        res.status(400).json({ message: 'Invalid chat ID' });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
});

app.put('/leave-group', async (req, res) => {
    try {
        const userId = req.user._id
        const chatId = req.body.currentChatId
        const userById = await User.findOne({ _id: userId.toString() })
        await Chat.updateOne({ _id: chatId },{ $pull: { members: userId.toString() }})
        const message = `${userById.username.charAt(0) + userById.username.slice(1).toLowerCase()} has left the group.`
        const newMessage = new Message({ chat: chatId, sender: userId, message: message });
    
        await newMessage.save();
        // Emit the new message to all connected clients in the same room
        await newMessage.populate('sender', 'username profilePicture')
        io.to(chatId).emit('messageReceived', newMessage);
        res.status(200).send({ message: 'Left Group!' })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
})

app.put('/add-member-to-group', async (req, res) => {
    try {
      const memberIds = req.body.addedMemberIds;
      const chatId = req.body.currentChatInfoId.toString();
  
      if (memberIds && chatId) {
        const userPromises = memberIds.map(memberId => User.findOne({ _id: memberId.toString() }));
        const users = await Promise.all(userPromises);
  
        const updateQuery = Array.isArray(memberIds)
          ? { $push: { members: { $each: memberIds } } }
          : { $push: { members: memberIds } };
  
        await Chat.updateOne({ _id: chatId }, updateQuery);
  
        for (const user of users) {
          const message = `${user.username.charAt(0) + user.username.slice(1).toLowerCase()} has joined the group.`;
          const newMessage = new Message({ chat: chatId, sender: user._id, message });
          await newMessage.save();
          
          await newMessage.populate('sender', 'username profilePicture');
  
          io.to(chatId).emit('messageReceived', newMessage);
        }

        io.to(memberIds).emit('memberAdded', chatId);
  
        res.status(200).send({ message: 'Added member(s) to group!' });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
});
  
    
  

app.post('/messages', async (req, res) => {
    try {
      const chatId = req.body.idInfo.chatId;
      const senderId = req.user._id.toString();
      const message = req.body.idInfo.message;
      const newMessage = new Message({ chat: chatId, sender: senderId, message: message });
  
      await newMessage.save();
  
      await newMessage.populate('sender', 'username profilePicture')
      // Emit the new message to all connected clients in the same room
      io.to(chatId).emit('messageReceived', newMessage);
  
      res.status(200).json(newMessage);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
  });
  

app.get('/sign-up', (req, res) => {
})

app.post('/sign-up', async (req, res) => {
    try {
        const password = req.body.password
        const username = req.body.username.toUpperCase();
        const email = req.body.email.toUpperCase();
        const userByEmail = await User.findOne({ email: email });
        const userByUsername = await User.findOne({ username: username });

        if (userByEmail && userByUsername) {
            return res.status(400).send({ message: "Email and Username have already been taken" });
        }
        
        if (!req.body.email || !req.body.username || !password) {
            return res.status(400).send({ message: "All fields are required" });
        } else if (userByEmail) {
            return res.status(400).send({ message: 'Email has already been taken'})
        } else if (userByUsername) {
            return res.status(400).send({ message: 'Username has already been taken'})
        }
        
        bcrypt.hash(password, 10, async (err, hashedPassword) => {
            if (err) console.log(err)
            const user = new User({
                email: email,
                username: username,
                password: hashedPassword,
            })
            await user.save()
            return res.status(200).send({ message: 'Created new User' })
        })
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
})

app.post('/log-in', (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) { 
            console.error(`Error: ${err}`);
            return res.status(500).send({ message: `Error: ${err}` });
        }
        if (!user) { 
            console.log(info)
            return res.status(401).send({ message: `${info.message}` });
        }
        req.logIn(user, function(err) {
            if (err) { 
                console.error(`Error: ${err}`);
                return res.status(500).send({ message: `Error: ${err}` });
            }
            return res.status(200).send({ message: "Authentication succeeded", user });
        });
    })(req, res, next);
});

app.get('/log-out', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        }
        return res.status(200).send({ message: 'Successfully logged out!' })
    })
})

app.put('/send-friend-request', async (req, res) => {
    try {
        const requestedFriendUserId = req.body.friend.toString()
        const userId = req.user._id.toString()
        if (!mongoose.Types.ObjectId.isValid(requestedFriendUserId) || requestedFriendUserId === userId) {
            return res.status(400).send({ message: `User not found`})
        }
        const userByFriendId = await User.findOne({ _id: requestedFriendUserId })
        if (!userByFriendId) {
            return res.status(400).send({ message: `User not found`})
        }
        const checkSentRequests = userByFriendId.sentFriendRequests.find(id => id.toString() === userId)
        const checkRecievedRequests = userByFriendId.receivedFriendRequests.find(id => id.toString() === userId)
        const checkFriendsList = userByFriendId.friends.find(id => id.toString() === userId)
        if (checkSentRequests) {
            await User.updateOne({ _id: requestedFriendUserId }, { $pull: { sentFriendRequests: userId } });
            await User.updateOne({ _id: userId }, { $pull: { receivedFriendRequests: requestedFriendUserId } });
            await User.updateOne({ _id: userId }, { $push: { friends: requestedFriendUserId } });
            await User.updateOne({ _id: requestedFriendUserId }, { $push: { friends: userId } });
            io.to(userId).emit('friendRequestAccepted', requestedFriendUserId);
            io.to(requestedFriendUserId).emit('friendRequestAccepted', userId);
            return res.status(200).send({ message: `They've already sent a request. Added!`})
        } else if (checkRecievedRequests) {
            return res.status(400).send({ message: `You've already sent them a friend request`})
        } else if (checkFriendsList) {
            return res.status(400).send({ message: `They're already your friend`})
        }
        await User.updateOne({ _id: requestedFriendUserId }, { $push: { receivedFriendRequests: userId }})
        await User.updateOne({ _id: userId }, { $push: { sentFriendRequests: requestedFriendUserId }})

        res.status(200).send({ message: 'Request Sent! '})
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
})

app.get('/sent-friend-requests', async (req, res) => {
    try {
        const userId = req.user._id.toString()
        const userById = await User.findOne({ _id: userId })
        if (userById) {
            let sentFriendRequestsInfo = []
            for (let i = 0; i < userById.sentFriendRequests.length; i++) {
                const userBySentId = await User.findOne({ _id: userById.sentFriendRequests[i] })
                sentFriendRequestsInfo.push(userBySentId)
            }
            res.status(200).json(sentFriendRequestsInfo);
        }
    } catch {
        res.status(500).json({ message: 'Server error' });
        console.log(err);
    }
})

app.get('/received-friend-requests', async (req, res) => {
    try {
        const userId = req.user._id.toString()
        const userById = await User.findOne({ _id: userId })
        if (userById) {
            const usersReceivedRequests = await User.find({ _id: { $in: userById.receivedFriendRequests } });
            res.status(200).json(usersReceivedRequests);
        } else {
            return res.status(404).send({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
        console.log(err)
    }
})

app.put('/accept-friend-request', async (req, res) => {
    try {
        console.log(req.body.requestedFriendId)
        const receivedFriendUserId = req.body.requestedFriendId.toString()
        const userId = req.user._id.toString()
        const userById = await User.findOne({ _id: userId })
        const recievedFriendUserById = await User.findOne({ _id: receivedFriendUserId })
        const checkSentRequests = recievedFriendUserById.sentFriendRequests.find(id => id.toString() === userId)
        const checkRecievedRequests = userById.receivedFriendRequests.find(id => id.toString() === receivedFriendUserId)
        if (checkSentRequests || checkRecievedRequests) {
            await User.updateOne({ _id: receivedFriendUserId }, { $pull: { sentFriendRequests: userId } });
            await User.updateOne({ _id: userId }, { $pull: { receivedFriendRequests: receivedFriendUserId } });
        } 

        await User.updateOne({ _id: userId }, { $push: { friends: receivedFriendUserId } });
        await User.updateOne({ _id: receivedFriendUserId }, { $push: { friends: userId } });

        const memberIds = [userId, receivedFriendUserId]
        const usersAlreadyHaveAChat = await Chat.findOne({ members: { $all: memberIds } });
        console.log(usersAlreadyHaveAChat)
        if (usersAlreadyHaveAChat && !usersAlreadyHaveAChat.isGroupChat) {
            io.to(userId).emit('friendRequestAccepted', receivedFriendUserId);
            io.to(receivedFriendUserId).emit('friendRequestAccepted', userId);
            return res.status(200).send({ message: 'Accepted!' })
        } 
        const chat = new Chat({ members: memberIds })
        await chat.save()
        io.to(userId).emit('friendRequestAccepted', receivedFriendUserId);
        io.to(receivedFriendUserId).emit('friendRequestAccepted', userId);
        res.status(200).send({ message: 'Accepted request and made a new chat!' })
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
})

app.put('/decline-friend-request', async (req, res) => {
    try {
        const receivedFriendUserId = req.body.requestedFriendId.toString()
        const userId = req.user._id.toString()
        const userById = await User.findOne({ _id: userId })
        const recievedFriendUserById = await User.findOne({ _id: receivedFriendUserId })
        const checkSentRequests = recievedFriendUserById.sentFriendRequests.find(id => id.toString() === userId)
        const checkRecievedRequests = userById.receivedFriendRequests.find(id => id.toString() === receivedFriendUserId)
        if (checkSentRequests || checkRecievedRequests) {
            await User.updateOne({ _id: receivedFriendUserId }, { $pull: { sentFriendRequests: userId } });
            await User.updateOne({ _id: userId }, { $pull: { receivedFriendRequests: receivedFriendUserId } });
            io.to(userId).emit('friendRequestDeclined', receivedFriendUserId);
            io.to(receivedFriendUserId).emit('friendRequestDeclined', userId);
        } 
        res.status(200).send({ message: 'Friend request has been declined' })
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
})

app.put('/unsend-friend-request', async (req, res) => {
    try {
        const receivedFriendUserId = req.body.requestedFriendId.toString()
        const userId = req.user._id.toString()
        const userById = await User.findOne({ _id: userId })
        const recievedFriendUserById = await User.findOne({ _id: receivedFriendUserId })
        const checkSentRequests = userById.sentFriendRequests.find(id => id.toString() === receivedFriendUserId)
        const checkRecievedRequests = recievedFriendUserById.receivedFriendRequests.find(id => id.toString() === userId)
        if (checkSentRequests || checkRecievedRequests) {
            await User.updateOne({ _id: userId }, { $pull: { sentFriendRequests: receivedFriendUserId } });
            await User.updateOne({ _id: receivedFriendUserId }, { $pull: { receivedFriendRequests: userId } });
            io.to(userId).emit('friendRequestUnsend', receivedFriendUserId);
            io.to(receivedFriendUserId).emit('friendRequestUnsend', userId);
        } 
        res.status(200).send({ message: 'Friend request has been unsent' })
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
})

app.get('/friends-list', async (req, res) => {
    try {
        const userId = req.user._id.toString()
        const userById = await User.findOne({ _id: userId })
        if (userById) {
            const usersFriendsList = await User.find({ _id: { $in: userById.friends } });
            res.status(200).json(usersFriendsList);
        } else {
            return res.status(404).send({ message: 'User not found' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
})

app.put('/remove-friend', async (req, res) => {
    try {
        const friendUserId = req.body.addedFriendId.toString()
        const userId = req.user._id.toString()
        const userById = await User.findOne({ _id: userId })
        const friendUserById = await User.findOne({ _id: friendUserId })
        const chat = await Chat.findOne({
            isGroupChat: false,
            members: { $all: [userId, friendUserId] }
          });
        if (userById && friendUserById) {
            await User.updateOne({ _id: userId }, { $pull: { friends: friendUserId } });
            await User.updateOne({ _id: friendUserId }, { $pull: { friends: userId } });
            io.to(userId).emit('friendRemoved', friendUserId, chat);
            io.to(friendUserId).emit('friendRemoved', userId, chat);
        }
        res.status(200).send({ message: 'Friend removed from friends list' })
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
})

app.put('/add-profile-picture', upload.single('profilePicture'), async (req, res) => {
    try {
        const oldProfilePicUrl = req.user.profilePicture;
        if (oldProfilePicUrl) {
            const oldImageKey = oldProfilePicUrl.split('/').pop(); // This gets the key of the old image file
        
            const deleteParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: oldImageKey
            };
        
            await s3Client.send(new DeleteObjectCommand(deleteParams));
        }

        // Use the buffer property attached by multer
        const fileBuffer = req.file.buffer;

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: new Date().toISOString().replace(/:/g, '-') + req.file.originalname,
            Body: fileBuffer,
        };
        
        const result = await s3Client.send(new PutObjectCommand(uploadParams));

        const profilePictureUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`; 

        const userId = req.user._id.toString();
        await User.updateOne({ _id: userId }, { profilePicture: profilePictureUrl });

        const user = await User.findById(userId);
        const friendIds = user.friends.map(friend => friend.toString());

        io.to(friendIds).emit('profilePictureAdded');

        res.status(200).send({ message: 'Profile Picture updated', url: profilePictureUrl });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Server error' });
    }
});

app.put('/add-group-picture', upload.single('groupPicture'), async (req, res) => {
    try {
      const chatById = await Chat.findOne({ _id: req.body.chatId.toString() })
      const memberIds = chatById.members.map(member => member._id.toString());
      const oldGroupPicUrl = chatById.groupPicture;
      if (oldGroupPicUrl) {
        const oldImageKey = oldGroupPicUrl.split('/').pop();
  
        const deleteParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: oldImageKey
        };
  
        await s3Client.send(new DeleteObjectCommand(deleteParams));
      }
  
      const fileBuffer = req.file.buffer;
  
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: new Date().toISOString().replace(/:/g, '-') + req.file.originalname,
        Body: fileBuffer,
      };
  
      const result = await s3Client.send(new PutObjectCommand(uploadParams));
  
      const groupPictureUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
  
      const chatId = req.body.chatId.toString();
      await Chat.updateOne({ _id: chatId }, { groupPicture: groupPictureUrl });
      io.to(memberIds).emit('groupPictureAdded');
      res.status(200).send({ message: 'Group Picture updated', url: groupPictureUrl });
    } catch (err) {
      console.log(err);
      res.status(500).send({ message: 'Server error' });
    }
  });
  


http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
