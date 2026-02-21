const mongoose = require('mongoose');

const ticketDocumentSchema = new mongoose.Schema({
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
    ticket_reply_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ticket_reply'
    },
    doc_path: {
        type: String,
        required: false
    },
    created_by: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    ticket_reply_dateTime: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('ticket_document', ticketDocumentSchema);
