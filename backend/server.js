require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGO_URL;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/logs', logRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running'
    });
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

if (!MONGODB_URL) {
    console.error('Missing MongoDB connection string. Set MONGODB_URL or MONGO_URL in backend/.env');
    process.exit(1);
}

mongoose
    .connect(MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error);
    });