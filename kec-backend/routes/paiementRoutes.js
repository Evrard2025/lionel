const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const { body } = require('express-validator');

// Routes pour les paiements
router.post('/initier', [
  body('userId').isInt({ min: 1 }).withMessage('userId requis'),
  body('formationId').isInt({ min: 1 }).withMessage('formationId requis')
], paiementController.initierPaiement);
router.post('/', [
  body('userId').isInt({ min: 1 }).withMessage('userId requis'),
  body('formationId').isInt({ min: 1 }).withMessage('formationId requis'),
  body('montant').isFloat({ min: 0 }).withMessage('Le montant doit être positif'),
  body('modePaiement').trim().notEmpty().withMessage('Le mode de paiement est requis')
], paiementController.createPaiement);           // Créer un nouveau paiement
router.get('/:id', paiementController.getPaiement);           // Récupérer un paiement
router.put('/:id/status', paiementController.updateStatus);   // Mettre à jour le statut d'un paiement
router.post('/webhook', paiementController.webhookPaiement);  // Webhook pour les notifications
router.get('/statut/:reference', paiementController.getPaiementByReference);

module.exports = router;