import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route imports
import healthRoutes from './routes/health.js';
import seedRoutes from './routes/seed.js';
import accountRoutes from './routes/accounts.js';
import journalRoutes from './routes/journalEntries.js';
import periodRoutes from './routes/periods.js';
import userRoutes from './routes/users.js';
import invoiceRoutes from './routes/invoices.js';
import bankRoutes from './routes/bankTransactions.js';
import authRoutes from './routes/auth.js';
import commissionPlanRoutes from './routes/commissionPlans.js';
import commissionTransactionRoutes from './routes/commissionTransactions.js';
import pasEventRoutes from './routes/pasEvents.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Connection
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Veridex Finance System Backend API',
    status: 'online',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/journal-entries', journalRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/bank-transactions', bankRoutes);
app.use('/api/commission-plans', commissionPlanRoutes);
app.use('/api/commission-transactions', commissionTransactionRoutes);
app.use('/api/pas-events', pasEventRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Veridex Finance System API Server Running`);
  console.log(`  Local URL:    http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

export default app;
