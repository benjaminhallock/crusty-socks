import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        },
        chatroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chatroom',
        },
        content: {
        type: String,
        required: true,
        },
    },
    {
        timestamps: true,
    }
    );