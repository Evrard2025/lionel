const express = require('express');
const router = express.Router();
const formationController = require('../controllers/formationController');
const { body } = require('express-validator');

// Routes CRUD pour les formations
router.get('/', formationController.getAllFormations);        // Liste toutes les formations
router.post('/', [
  body('titre').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('prix').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('duree').trim().notEmpty().withMessage('La durée est requise'),
  body('ticketsTotal').optional().isInt({ min: 0 }).withMessage('Le nombre total de tickets doit être positif'),
  body('ticketsDisponibles').optional().isInt({ min: 0 }).withMessage('Le nombre de tickets disponibles doit être positif')
], formationController.createFormation);
router.get('/:id', formationController.getFormationById);     // Récupère une formation par ID
router.put('/:id', [
  body('titre').optional().trim().notEmpty().withMessage('Le titre est requis'),
  body('description').optional().trim().notEmpty().withMessage('La description est requise'),
  body('prix').optional().isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('duree').optional().trim().notEmpty().withMessage('La durée est requise'),
  body('ticketsTotal').optional().isInt({ min: 0 }).withMessage('Le nombre total de tickets doit être positif'),
  body('ticketsDisponibles').optional().isInt({ min: 0 }).withMessage('Le nombre de tickets disponibles doit être positif')
], formationController.updateFormation);
router.delete('/:id', formationController.deleteFormation);   // Supprime une formation

module.exports = router;