import express from 'express';
import Project from '../../models/Project.js';
import mongoose from 'mongoose';

const router = express.Router();

// Store projects in memory (you might want to use a database in production)
const projects = new Map();

// GET /api/projects - List all projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/projects
router.post('/projects', async (req, res) => {
    try {
        // Assuming userId and projectName might be added later or are not critical for initial save
        // For now, we'll use placeholder values.
        const userId = req.body.userId || 'placeholder_user'; 
        const projectName = req.body.projectName || 'Unnamed Project';
        
        // The frontend sends the design details directly in the body.
        const configData = req.body;

        // Validate required fields from the frontend body - check for undefined or null
        if (configData === undefined || configData === null ||
            configData.elements === undefined || configData.elements === null ||
            configData.size === undefined || configData.size === null ||
            configData.material === undefined || configData.material === null ||
            configData.color === undefined || configData.color === null ||
            configData.view === undefined || configData.view === null) {
             return res.status(400).json({ 
                 error: 'Missing required fields: elements, size, material, color, or view are missing or null/undefined in the request body.' 
             });
        }

        // Create new project
        const project = new Project({
            userId,
            projectName,
            configData
        });

        // Save to database
        const savedProject = await project.save();

        // Return project ID
        res.status(201).json({
            projectId: savedProject._id
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            error: 'Internal server error: ' + error.message
        });
    }
});

// POST /api/projects/:projectId/link-order
router.post('/projects/:projectId/link-order', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { prestaOrderId } = req.body;

        // Validate prestaOrderId
        if (!prestaOrderId) {
            return res.status(400).json({
                error: 'prestaOrderId is required'
            });
        }

        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                error: 'Invalid project ID format'
            });
        }

        // Find and update the project
        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { prestaOrderId },
            { new: true }
        );

        // Check if project exists
        if (!updatedProject) {
            return res.status(404).json({
                error: 'Project not found'
            });
        }

        res.json({
            message: 'Project successfully linked to order',
            projectId: updatedProject._id,
            prestaOrderId: updatedProject.prestaOrderId
        });
    } catch (error) {
        console.error('Error linking project to order:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET /api/projects/by-order/:prestaOrderId
router.get('/projects/by-order/:prestaOrderId', async (req, res) => {
    try {
        const { prestaOrderId } = req.params;

        // Find project by prestaOrderId
        const project = await Project.findOne({ prestaOrderId });

        // Check if project exists
        if (!project) {
            return res.status(404).json({
                error: 'Project not found for this order'
            });
        }

        // Generate preview URL (replace with your actual domain)
        const previewUrl = `http://localhost:5173/viewer?id=${project._id}`;

        // Return required fields
        res.json({
            projectName: project.projectName, // Assuming projectName is stored
            createdAt: project.createdAt, // Assuming createdAt is stored
            projectId: project._id, // Include project ID for the frontend to use
            configData: project.configData // Include configData for the frontend to render
        });
    } catch (error) {
        console.error('Error fetching project by order:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

router.post('/', (req, res) => {
    const projectId = Date.now().toString();
    const project = {
        id: projectId,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    projects.set(projectId, project);
    
    res.json({ id: projectId });
});

router.get('/by-order/:orderId', (req, res) => {
    const { orderId } = req.params;
    // In a real application, you would look up the project ID from the order
    // For now, we'll just return the first project
    const project = Array.from(projects.values())[0];
    
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
});

export default router; 