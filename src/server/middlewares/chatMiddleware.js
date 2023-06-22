const mongoose = require('mongoose')
const User = require('../models/user')
const Chat = require('../models/chat');

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
        /* next(); */
        return res.status(400).send({ message: `Chat found but your not in the group` });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server error" });
    }
};

module.exports = ensureChatIsReal;