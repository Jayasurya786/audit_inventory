const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    actor: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    resource: {
        type: String,
        required: true,
        trim: true
    },
    resourceType: {
        type: String,
        required: true,
        trim: true
    },
    ipAddress: {
        type: String,
        required: true,
        trim: true
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    severity: {
        type: String,
        required: true,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    status: {
        type: String,
        required: true,
        enum: ['Unresolved', 'Resolved', 'Investigating'],
        default: 'Unresolved'
    },
    timestamp: {
        type: Date,
        required: true
    }

});

LogSchema.index({ timestamp: -1 });
LogSchema.index({ severity: 1, status: 1, timestamp: -1 });
LogSchema.index({ actor: 1, timestamp: -1 });
LogSchema.index({ region: 1, timestamp: -1 });
LogSchema.index({ resourceType: 1, timestamp: -1 });
LogSchema.index({ actor: 'text', action: 'text', resource: 'text' });
module.exports = mongoose.model('Log', LogSchema);