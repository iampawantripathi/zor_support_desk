const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const URL = dotenv.parsed.DB_URL;

const connectDB = () => {
    return mongoose.connect(URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};

module.exports = connectDB;
