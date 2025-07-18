require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { initDatabase } = require('./config/database');

// Import des routes
const userRoutes = require('./routes/userRoutes');
const formationRoutes = require('./routes/formationRoutes');
const paiementRoutes = require('./routes/paiementRoutes');

// Initialisation de l'application
const app = express();

// Middleware de sécurité
app.use(helmet());

// Middleware de sécurité supplémentaire pour headers manquants
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self'; " +
      "object-src 'none'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com https://boostalab.com https://images.unsplash.com; " +
      "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
      "connect-src 'self' https://lionel-bzdx.onrender.com;"
    );
    res.setHeader('X-Frame-Options', 'DENY');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.removeHeader('Server');
    app.disable('x-powered-by');
    next();
});

// Configuration CORS sécurisée
const productionAllowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? productionAllowedOrigins.map(origin => origin.trim())
        : [
            process.env.CORS_ORIGIN || 'http://localhost:3000',
            'http://127.0.0.1:5502', // Peut être supprimé ou conditionnel si non pertinent en dev local
            'http://localhost:5502', // Peut être supprimé ou conditionnel si non pertinent en dev local
            'https://kectombolaformation.com', // Idéalement géré via CORS_ORIGIN en prod
            'http://kectombolaformation.com'   // Idéalement géré via CORS_ORIGIN en prod
          ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 heures
};
app.use(cors(corsOptions));

// Middlewares
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging pour le débogage (uniquement en développement)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        console.log('Body:', req.body);
        next();
    });
}

// Initialisation de la base de données
initDatabase();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/paiements', paiementRoutes);

// Gestion des erreurs améliorée
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Une erreur est survenue' 
        : err.message;
    
    res.status(statusCode).json({
        error: {
            message,
            status: statusCode,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
});

// Gestion des routes non trouvées
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route non trouvée',
            status: 404
        }
    });
});

// Port d'écoute
const PORT = process.env.PORT || 5502;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur en écoute sur le port ${PORT} en mode ${process.env.NODE_ENV}`);
});