const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('token', tokenSchema);
