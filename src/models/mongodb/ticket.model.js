const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'company',
        required: true
    },
    company_uid: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: false
    },
    ticketId: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical']
    },
    document: {
        type: Number,
        required: false
    },
    created_by: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open',
        required: true
    },
    ticket_dateTime: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('ticket', ticketSchema);
