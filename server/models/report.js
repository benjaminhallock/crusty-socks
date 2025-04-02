import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reportedUser: { type: String, required: true }, 
    reportedBy: { type: String, required: true },
    roomId: { type: String, required: true },
    reason: { type: String, required: true },
    additionalComments: { type: String },
    timestamp: { type: Date, default: Date.now },
    chatLogs: [
        {
            username: String,
            message: String,
            timestamp: Date,
        },
    ],
    drawingData: { type: String }, // Base64 encoded drawing data
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending',
    },
});

export default mongoose.model('Report', reportSchema);
