const rateLimit = require('express-rate-limit');

// Limiteur global pour toutes les routes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par fenêtre
    message: {
        error: {
            message: 'Trop de requêtes, veuillez réessayer plus tard',
            status: 429
        }
    },
    standardHeaders: true, // Retourne les en-têtes RateLimit-*
    legacyHeaders: false, // Désactive les en-têtes X-RateLimit-*
});

// Limiteur plus strict pour les routes d'authentification
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // limite chaque IP à 5 tentatives de connexion par heure
    message: {
        error: {
            message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
            status: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiteur pour les routes d'inscription
const registerLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 heures
    max: 3, // limite chaque IP à 3 inscriptions par jour
    message: {
        error: {
            message: 'Trop de tentatives d\'inscription, veuillez réessayer demain',
            status: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    authLimiter,
    registerLimiter
}; 