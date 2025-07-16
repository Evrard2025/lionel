const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');

// Routes pour les paiements
router.post('/initier', paiementController.initierPaiement);
router.post('/', paiementController.createPaiement);           // Créer un nouveau paiement
router.get('/:id', paiementController.getPaiement);           // Récupérer un paiement
router.put('/:id/status', paiementController.updateStatus);   // Mettre à jour le statut d'un paiement
router.post('/webhook', paiementController.webhookPaiement);  // Webhook pour les notifications

module.exports = router;