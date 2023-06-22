const express = require('express')
const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        required: true
    },
    isGroupChat: {
        type: Boolean,
        default: false
    },
    isOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    groupPicture: {
        type: String,
        required: false
    },
    chatName: { // Optional, for group chats
        type: String
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Chat', chatSchema);
