require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { isCelebrateError } = require('celebrate');
const path = require('path');

const connectDB = require('./src/config/mongodb_con');;
const route = require('./src/routes/route');
const errorHandler = require('./src/middlewares/errorHandler');
const ResponseService = require('./src/services/service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Then load routes (now all protected)
app.use('/', route);

// Celebrate validation error handler - must be BEFORE your global error handler
app.use((err, req, res, next) => {
    if (!isCelebrateError(err)) return next(err);

    const errorBody = err.details.get('query') || err.details.get('body') || err.details.get('params');
    const { details: [errorDetails] } = errorBody;

    return ResponseService.error(res, { message: errorDetails.message }, 400);
});

// Custom global error handler
app.use(errorHandler.handle);

// 404 handler
app.use((req, res) => {
    ResponseService.error(res, { message: 'Endpoint not found' }, 404);
});

// DB connection and start
connectDB()
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
