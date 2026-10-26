const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { corsOrigin } = require('./config/env');
const authMiddleware = require('./middleware/auth.middleware');
const originMiddleware = require('./middleware/origin.middleware');
const { clearAuthCookies, cookieName } = require('./utils/cookies.utils');
const authService = require('./services/auth.service');

const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const clientDetailRoutes = require('./routes/client-detail.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const interactionRoutes = require('./routes/interaction.routes');
const lookupRoutes = require('./routes/lookup.routes');
const opportunityRoutes = require('./routes/opportunity.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(originMiddleware.verifyOrigin);

// --- PÚBLICAS ---
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime() });
});

app.use('/auth', authRoutes);

// --- PROTEGIDAS ---
app.use(authMiddleware.verifyToken);

app.use('/clients', clientRoutes);
app.use('/clients', clientDetailRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/interactions', interactionRoutes);
app.use('/lookups', lookupRoutes);
app.use('/opportunities', opportunityRoutes);
app.use('/users', userRoutes);

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  });
});

// --- ERROR HANDLER ---
// eslint-disable-next-line no-unused-vars
app.use(async (error, req, res, next) => {
  console.error('Unhandled error:', error);

  if (res.headersSent) return;

  const status = error.statusCode || 500;

  if (status >= 500) {
    try {
      await authService.logout(
        req.cookies?.[cookieName('refreshToken')],
        req.cookies?.[cookieName('accessToken')]
      );
    } catch (logoutError) {
      console.error('Could not revoke session after server error:', logoutError.message);
    }
    clearAuthCookies(res);
  }

  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Erro interno do servidor.' : error.message
  });
});

module.exports = app;
