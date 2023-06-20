const express = require('express');
const router = express.Router();
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Chat = require('../models/chat');
const User = require('../models/user');
const Message = require('../models/messages');
const { upload, s3Client } = require('../controllers/s3Controller');

router.post('/create-group', upload.single('groupPicture'), async (req, res) => {
    try {
      const groupChatName = req.body.newGroupName;
      const groupPicture = req.file;
  
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
  

router.delete('/delete-group', async (req, res) => {
    const io = req.app.locals.io
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

router.put('/leave-group', async (req, res) => {
    const io = req.app.locals.io
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

router.put('/add-member-to-group', async (req, res) => {
    const io = req.app.locals.io
    try {
      const memberIds = req.body.addedMemberIds;
      const chatId = req.body.currentChatInfoId.toString();
  
      if (memberIds.length !== 0 && chatId) {
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
      } else {
        res.status(400).send({ message: 'Select member(s) to add' });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
});

router.put('/add-group-picture', upload.single('groupPicture'), async (req, res) => {
    const io = req.app.locals.io
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

module.exports = router;