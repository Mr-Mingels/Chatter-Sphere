const express = require('express');
const router = express.Router();
const mongoose = require("mongoose")
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Chat = require('../models/chat');
const User = require('../models/user');
const { upload, s3Client } = require('../controllers/s3Controller');



router.put('/send-friend-request', async (req, res) => {
    const io = req.app.locals.io
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

router.get('/sent-friend-requests', async (req, res) => {
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

router.get('/received-friend-requests', async (req, res) => {
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

router.put('/accept-friend-request', async (req, res) => {
    const io = req.app.locals.io
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
        } 

        await User.updateOne({ _id: userId }, { $push: { friends: receivedFriendUserId } });
        await User.updateOne({ _id: receivedFriendUserId }, { $push: { friends: userId } });

        const memberIds = [userId, receivedFriendUserId]
        const usersAlreadyHaveAChat = await Chat.findOne({ members: { $all: memberIds } });
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

router.put('/decline-friend-request', async (req, res) => {
    const io = req.app.locals.io
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

router.put('/unsend-friend-request', async (req, res) => {
    const io = req.app.locals.io
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

router.get('/friends-list', async (req, res) => {
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

router.put('/remove-friend', async (req, res) => {
    const io = req.app.locals.io
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

router.put('/add-profile-picture', upload.single('profilePicture'), async (req, res) => {
    const io = req.app.locals.io
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

module.exports = router;