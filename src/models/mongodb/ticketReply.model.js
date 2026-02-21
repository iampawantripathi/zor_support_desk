const mongoose = require('mongoose');

const ticketReplySchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'company',
        required: true
    },
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ticket',
        required: true
    },
    user_id: {
        type: String,
        required: false
    },
    reply_msg: {
        type: String,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    ticket_reply_dateTime: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('ticket_reply', ticketReplySchema);
