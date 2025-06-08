import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import projectsRouter from './routes/projects.js';
import pingRouter from './routes/ping.js';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'https://twoja-domena.pl'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // max 100 żądań z jednego IP
});
app.use(limiter);
app.use(express.json());

// MongoDB connection (optional)
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rashguard-designer');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.warn('MongoDB connection warning:', err.message);
        console.log('Server will continue without database connection');
    }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', projectsRouter);
app.use('/api', pingRouter);

// Global error handler (na końcu pliku, przed listen)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 