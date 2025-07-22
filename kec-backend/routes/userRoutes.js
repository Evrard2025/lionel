const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body } = require('express-validator');

// Routes pour les utilisateurs
router.post('/', [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('telephone').trim().notEmpty().withMessage('Le numéro de téléphone est requis'),
  body('niveauEtude').trim().notEmpty().withMessage("Le niveau d'étude est requis"),
  body('formationChoisie').trim().notEmpty().withMessage('La formation est requise')
], userController.registerUser);        // Inscription (POST /api/users)
router.get('/:id', userController.getUserInfo);       // Récupérer les infos utilisateur (GET /api/users/:id)

module.exports = router;