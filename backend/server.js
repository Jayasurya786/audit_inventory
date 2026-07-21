require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const logRoutes = require('./routes/logRoutes');

const app = express();
const parsedPort = Number.parseInt(process.env.PORT, 10);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5000;
const normalizeMongoUrl = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();

    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1).trim();
    }

    return trimmed;
};

const MONGODB_URL = normalizeMongoUrl(process.env.MONGODB_URL || process.env.MONGO_URL);

if (process.env.PORT && (!Number.isInteger(parsedPort) || parsedPort <= 0)) {
    console.warn(`Ignoring invalid PORT value: ${process.env.PORT}`);
}

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});

if (!MONGODB_URL) {
    console.error('Missing MongoDB connection string. Set MONGODB_URL or MONGO_URL in backend/.env');
    process.exit(1);
}

if (!MONGODB_URL.startsWith('mongodb://') && !MONGODB_URL.startsWith('mongodb+srv://')) {
    console.error('Invalid MongoDB connection string. It must start with mongodb:// or mongodb+srv://');
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
