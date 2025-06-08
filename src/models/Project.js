import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    configData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    prestaOrderId: {
        type: String,
        required: false,
        default: null
    }
});

const Project = mongoose.model('Project', projectSchema);

export default Project; 