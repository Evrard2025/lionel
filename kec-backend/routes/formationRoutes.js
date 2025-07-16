const express = require('express');
const router = express.Router();
const formationController = require('../controllers/formationController');

// Routes CRUD pour les formations
router.get('/', formationController.getAllFormations);        // Liste toutes les formations
router.post('/', formationController.createFormation);        // Crée une nouvelle formation
router.get('/:id', formationController.getFormationById);     // Récupère une formation par ID
router.put('/:id', formationController.updateFormation);      // Met à jour une formation
router.delete('/:id', formationController.deleteFormation);   // Supprime une formation

module.exports = router;