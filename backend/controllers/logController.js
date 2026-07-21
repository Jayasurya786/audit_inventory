const mongoose = require('mongoose');
const Log = require('../models/Log');

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const ALLOWED_SORT_FIELDS = new Set([
    'timestamp',
    'severity',
    'status',
    'actor',
    'region',
    'resourceType',
    'action'
]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseOptionalString = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
};

const buildLogsQuery = (query) => {
    const filter = {};
    const exactFilterFields = [
        'severity',
        'status',
        'actor',
        'role',
        'action',
        'resource',
        'resourceType',
        'ipAddress',
        'region'
    ];

    for (const field of exactFilterFields) {
        const value = parseOptionalString(query[field]);

        if (value) {
            filter[field] = value;
        }
    }

    const search = parseOptionalString(query.search);

    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        filter.$or = [
            { actor: regex },
            { role: regex },
            { action: regex },
            { resource: regex },
            { resourceType: regex },
            { ipAddress: regex },
            { region: regex },
            { severity: regex },
            { status: regex }
        ];
    }

    return filter;
};

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const respondDatabaseUnavailable = (res) =>
    res.status(503).json({
        success: false,
        message: 'Database is not connected yet. Please try again in a moment.'
    });

exports.bulkUploadLogs = async (req, res) => {
    if (!isDatabaseReady()) {
        return respondDatabaseUnavailable(res);
    }

    try {
        const logs = req.body;

        if (!Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payload, expected a non-empty array.'
            });
        }

        const result = await Log.insertMany(logs, { ordered: false });

        return res.status(201).json({
            success: true,
            message: 'Logs uploaded successfully.',
            count: result.length
        });
    } catch (error) {
        if (error.name === 'BulkWriteError' || error.code === 11000) {
            return res.status(207).json({
                success: true,
                message: 'Bulk upload finished with a few skipped records.',
                insertedCount: error.result?.nInserted || 0,
                errorsCount: error.writeErrors ? error.writeErrors.length : 0
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error during bulk upload.',
            error: error.message
        });
    }
};

exports.getLogs = async (req, res) => {
    if (!isDatabaseReady()) {
        return respondDatabaseUnavailable(res);
    }

    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
        const sortBy = ALLOWED_SORT_FIELDS.has(req.query.sortBy) ? req.query.sortBy : 'timestamp';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const filter = buildLogsQuery(req.query);
        const sort = { [sortBy]: sortOrder };

        const [total, logs] = await Promise.all([
            Log.countDocuments(filter),
            Log.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)
        ]);

        return res.status(200).json({
            success: true,
            page,
            limit,
            count: logs.length,
            total,
            totalPages: Math.max(Math.ceil(total / limit), 1),
            sortBy,
            sortOrder: sortOrder === 1 ? 'asc' : 'desc',
            data: logs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching logs.',
            error: error.message
        });
    }
};
