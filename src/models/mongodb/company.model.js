const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true
    },
    company_name: {
        type: String,
        required: true
    },
    company_details: {
        type: Object,
        required: true
    },
    role: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('company', companySchema);
