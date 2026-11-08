const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'TeamSync API', time: new Date() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api', require('./routes/insightRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
