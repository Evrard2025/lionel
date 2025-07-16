const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Routes pour les utilisateurs
router.post('/', userController.registerUser);        // Inscription (POST /api/users)
router.get('/:id', userController.getUserInfo);       // Récupérer les infos utilisateur (GET /api/users/:id)

module.exports = router;