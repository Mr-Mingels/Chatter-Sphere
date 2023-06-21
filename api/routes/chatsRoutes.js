const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const Message = require('../models/messages')
const ensureChatIsReal = require('../../../api/controllers/middlewares/chatMiddleware');


router.get('/users/chats', async (req, res) => {
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

router.get('/chats/:chatId/messages', ensureChatIsReal, async (req, res) => {
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
  
router.post('/messages', async (req, res) => {
    const io = req.app.locals.io
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

router.delete('/delete-message', async (req, res) => {
    const io = req.app.locals.io
  try {
    if (req.body.selectedMsg) {
      const messageId = req.body.selectedMsg._id;
      const messageChatId = req.body.selectedMsg.chat;
      const chat = await Chat.findOne({ _id: messageChatId.toString() });
      const chatId = chat._id.toString();
      const deleteMsg = await Message.findOneAndDelete({ _id: messageId.toString() });
      
      if (deleteMsg) {
        io.to(chatId).emit('messageDeleted', messageId);
        res.status(200).json({ message: 'Message deleted' });
      } else {
        res.status(404).json({ message: 'Message not found' });
      }
    } else {
      res.status(400).json({ message: 'Invalid message' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;