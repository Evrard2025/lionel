const axios = require('axios');
const Paiement = require('../models/Paiement');
const Formation = require('../models/Formation');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// Log des variables d'environnement au démarrage
if (process.env.NODE_ENV !== 'production') {
  console.log('[CONFIG] Variables d\'environnement:', {
    MAIL_USER: process.env.MAIL_USER ? 'configuré' : 'non configuré',
    MAIL_PASS: process.env.MAIL_PASS ? 'configuré' : 'non configuré',
    YENGA_API_KEY: process.env.YENGA_API_KEY ? 'configuré' : 'non configuré'
  });
}

// Initialiser un paiement avec YengaPay
exports.initierPaiement = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { userId, formationId } = req.body;
    
    // Vérifier l'utilisateur et la formation
    const user = await User.findByPk(userId);
    const formation = await Formation.findByPk(formationId);
    
    if (!user || !formation) {
      return res.status(404).json({ error: 'Utilisateur ou formation non trouvé' });
    }

    // Vérifier la disponibilité des tickets
    if (formation.ticketsDisponibles <= 0) {
      return res.status(400).json({ error: 'Désolé, tous les tickets ont été vendus' });
    }

    // S'assurer que le prix est un nombre
    const montant = Number(formation.prix);
    if (isNaN(montant)) {
      return res.status(400).json({ error: 'Prix de la formation invalide' });
    }

    // Générer une référence unique pour le paiement
    const reference = `KEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Configurer la requête pour YengaPay selon la documentation exacte
    const payload = {
      paymentAmount: montant,
      reference: reference,
      articles: [{
        title: formation.titre || 'Formation KEC',
        description: `Paiement pour la formation ${formation.titre || 'KEC'} (${formation.ticketsDisponibles} tickets restants)`,
        pictures: [formation.imageUrl || 'https://quixy.com/wp-content/uploads/2020/05/Solutions_Finance_Theme-1.png'],
        price: montant
      }]
    };

    // Utiliser l'API key depuis les variables d'environnement
    const apiKey = process.env.YENGA_API_KEY || 'FY2JesSN7qENbWoKfERlIcIvtfoBCjFl';

    console.log('Payload YengaPay:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'https://api.yengapay.com/api/v1/groups/10315194/payment-intent/61819',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    // Réserver un ticket en diminuant le nombre de tickets disponibles
    // await formation.update({
    //   ticketsDisponibles: formation.ticketsDisponibles - 1
    // });

    // Créer un enregistrement de paiement
    const newPaiement = await Paiement.create({
      userId,
      formationId,
      montant: montant,
      modePaiement: 'YengaPay',
      reference: reference,
      statut: 'en_attente',
      details: response.data
    });

    res.status(200).json({
      checkoutUrl: response.data.checkoutPageUrlWithPaymentToken,
      paiementId: newPaiement.id,
      reference: reference,
      ticketsDisponibles: formation.ticketsDisponibles - 1
    });
  } catch (err) {
    console.error('Erreur YengaPay:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Erreur lors du paiement',
      details: err.response?.data || err.message
    });
  }
};

// Créer un nouveau paiement
exports.createPaiement = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { userId, formationId, montant, modePaiement } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si la formation existe
    const formation = await Formation.findByPk(formationId);
    if (!formation) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }

    const paiement = await Paiement.create({
      userId,
      formationId,
      montant,
      modePaiement,
      statut: 'en_attente',
      reference: `KEC-${Date.now()}`
    });

    res.status(201).json(paiement);
  } catch (err) {
    console.error('Erreur création paiement:', err);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
};

// Récupérer un paiement
exports.getPaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'nom', 'email'] },
        { model: Formation, attributes: ['id', 'titre', 'prix'] }
      ]
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    res.status(200).json(paiement);
  } catch (err) {
    console.error('Erreur récupération paiement:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du paiement' });
  }
};

// Nouvelle route pour vérifier le statut d'un paiement par référence
exports.getPaiementByReference = async (req, res) => {
  try {
    const paiement = await Paiement.findOne({ where: { reference: req.params.reference } });
    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }
    res.status(200).json({
      statut: paiement.statut,
      emailStatus: paiement.statut === 'payé' ? 'envoye' : 'non_envoye'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du paiement' });
  }
};

// Mettre à jour le statut d'un paiement
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const paiement = await Paiement.findByPk(req.params.id);

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    await paiement.update({ statut: status });
    res.status(200).json(paiement);
  } catch (err) {
    console.error('Erreur mise à jour statut:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
};

// Fonction utilitaire pour envoyer le reçu par email
async function envoyerRecuPaiement({ email, nom, reference, ticketNumber, formationTitre }) {
  try {
    console.log('[MAIL] Début génération QR code pour', email, 'réf:', reference);
    // Générer le QR code (en tant que buffer)
    const qrData = `Référence: ${reference}\nTicket: ${ticketNumber}`;
    console.log('[MAIL] Données pour QR code:', qrData);
    const qrCodeBuffer = await QRCode.toBuffer(qrData);
    console.log('[MAIL] QR code généré (Buffer)');

    // Log des variables d'environnement utilisées pour l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MAIL] Variables d\'environnement utilisées:', {
        MAIL_USER: process.env.MAIL_USER,
        MAIL_PASS: process.env.MAIL_PASS
      });
    }

    // Chemin du logo
    const path = require('path');
    const logoPath = path.resolve(__dirname, '../../front/logo.png');
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MAIL] Chemin du logo utilisé:', logoPath);
    }

    // Configurer le transporteur nodemailer (exemple Gmail, à adapter)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER || 'ton.email@gmail.com',
        pass: process.env.MAIL_PASS || 'ton_mot_de_passe_app',
      },
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MAIL] Transporteur nodemailer configuré');
    }

    // Email HTML stylé
    const html = `
      <div style="font-family:Montserrat,Arial,sans-serif;background:#f9f9f9;padding:30px;">
        <div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px #0001;padding:30px 30px 20px 30px;">
          <div style="text-align:center; margin-bottom: 0px;">
            <img src="cid:logo_image" alt="KEC GROUP Logo" style="width: 200px; height: auto;"/>
          </div>
          <h2 style="color:#1874a5;text-align:center;margin-bottom:10px;">🎫 Reçu de Paiement KEC GROUP</h2>
          <p style="font-size:1.1em;text-align:center;margin-bottom:20px;">Merci <b>${nom}</b> pour votre inscription à la formation <b>${formationTitre}</b>.</p>
          <div style="background:#f0f0ff;padding:18px 20px;border-radius:8px;margin-bottom:20px;">
            <p style="margin:0 0 8px 0;font-size:1.1em;"><b>Référence paiement :</b> <span style="color:#7b2dff;">${reference}</span></p>
            <p style="margin:0 0 8px 0;font-size:1.1em;font-weight: bold;"><b>Numéro de ticket :</b> <span style="color:#7b2dff;">${ticketNumber}</span></p>
          </div>
          <div style="text-align:center;margin-bottom:18px;">
            <img src="cid:qrcode_ticket" alt="QR Code Ticket" style="width:160px;height:160px;border-radius:8px;border:2px solid #00f7ff;background:#fff;"/>
            <p style="font-size:0.95em;color:#888;margin-top:8px;">Scannez le QR code</p>
          </div>
          <div style="text-align:center;margin-top:18px;font-size:0.98em;color:#555;">Contact: 70938590 / 55092592</div>
          <div style="text-align:center;margin-top:18px;font-size:0.98em;color:#555;">KEC GROUP &copy; 2025</div>
        </div>
      </div>
    `;

    console.log('[MAIL] Préparation de l\'envoi du mail à', email);
    const info = await transporter.sendMail({
      from: 'KEC GROUP <no-reply@kecgroup.com>',
      to: email,
      subject: 'Votre reçu de paiement - KEC GROUP',
      html,
      attachments: [{
        filename: 'qrcode_ticket.png',
        content: qrCodeBuffer,
        cid: 'qrcode_ticket' // same cid value as in the html img src
      },
      {
        filename: 'logo.png',
        path: logoPath, // Chemin dynamique
        cid: 'logo_image' // same cid value as in the html img src
      }]
    });
    console.log('[MAIL] Mail envoyé ! ID:', info.messageId);
  } catch (err) {
    console.error('[MAIL][ERREUR] lors de l\'envoi du mail:', err);
    if (err.message) console.error('[MAIL][ERREUR] Message:', err.message);
    if (err.code) console.error('[MAIL][ERREUR] Code:', err.code);
    if (err.stack) console.error('[MAIL][ERREUR] Stack:', err.stack);
    throw err;
  }
}

// Webhook pour les notifications de paiement
exports.webhookPaiement = async (req, res) => {
  // Vérification du hash HMAC SHA256 YengaPay
  const receivedHash = req.headers['x-webhook-hash'];
  const webhookSecretYengaPay = '92f9e221-5955-4a4a-a30c-dbd74d77b6b5';
  const payload = req.body;
  const payloadHashed = crypto.createHmac('sha256', webhookSecretYengaPay)
    .update(JSON.stringify(payload))
    .digest('hex');
  if (payloadHashed !== receivedHash) {
    console.error('[WEBHOOK] Hash mismatch:', { payloadHashed, receivedHash });
    return res.status(401).json({ error: 'Hash mismatch, webhook non authentifié' });
  }
  try {
    // Log explicite pour chaque appel reçu
    console.log(`[WEBHOOK][RECU] Appel webhook reçu à ${new Date().toISOString()} avec body:`, JSON.stringify(req.body));
    const { reference, paymentStatus } = req.body;
    
    if (!reference || !paymentStatus) {
      console.error('[WEBHOOK] Données invalides:', { reference, paymentStatus });
      return res.status(400).json({ 
        error: 'Données invalides: reference et paymentStatus sont requis',
        emailStatus: 'non_envoye'
      });
    }

    if (paymentStatus === 'DONE') {
      console.log(`[WEBHOOK][SUCCESS] Statut de paiement reçu = 'DONE' pour la référence: ${reference}`);
    }

    console.log('[WEBHOOK] Recherche paiement avec référence:', reference);
    const paiement = await Paiement.findOne({ 
      where: { reference },
      include: [
        { 
          model: Formation,
          as: 'Formation'
        },
        { 
          model: User,
          as: 'User'
        }
      ]
    });

    if (!paiement) {
      console.log('[WEBHOOK] Paiement non trouvé pour ref', reference);
      return res.status(404).json({ 
        error: 'Paiement non trouvé',
        emailStatus: 'non_envoye'
      });
    }

    if (!paiement.User) {
      console.error('[WEBHOOK] Utilisateur non trouvé pour le paiement:', paiement.id);
      return res.status(500).json({ 
        error: 'Utilisateur non trouvé pour ce paiement',
        emailStatus: 'non_envoye'
      });
    }

    if (!paiement.Formation) {
      console.error('[WEBHOOK] Formation non trouvée pour le paiement:', paiement.id);
      return res.status(500).json({ 
        error: 'Formation non trouvée pour ce paiement',
        emailStatus: 'non_envoye'
      });
    }

    console.log('[WEBHOOK] Paiement trouvé:', {
      id: paiement.id,
      statut: paiement.statut,
      email: paiement.User.email,
      formation: paiement.Formation.titre,
      reference: paiement.reference
    });

    // Si le paiement est annulé ou échoué, remettre le ticket en disponibilité
    if (paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') {
      console.log('[WEBHOOK] Paiement annulé/échoué, remise du ticket en disponibilité');
      await paiement.Formation.increment('ticketsDisponibles');
      return res.status(200).json({ 
        message: 'Paiement annulé/échoué',
        ticketsDisponibles: paiement.Formation.ticketsDisponibles,
        emailStatus: 'non_envoye'
      });
    }

    // Décrémenter le nombre de tickets uniquement si le paiement est un succès
    if (paymentStatus === 'DONE') {
      await paiement.Formation.decrement('ticketsDisponibles');
    }

    console.log('[WEBHOOK] Mise à jour statut paiement:', paymentStatus);
    await paiement.update({ 
      statut: paymentStatus === 'DONE' ? 'payé' : 'échoué'
    });

    let emailStatus = 'non_envoye';
    let emailError = null;

    // Envoi du reçu si paiement réussi
    if (paymentStatus === 'DONE') {
      try {
        console.log('[WEBHOOK] Paiement réussi, préparation envoi reçu à', paiement.User.email);
        console.log('[WEBHOOK] Configuration email:', {
          MAIL_USER: process.env.MAIL_USER ? 'configuré' : 'non configuré',
          MAIL_PASS: process.env.MAIL_PASS ? 'configuré' : 'non configuré'
        });
        
        await envoyerRecuPaiement({
          email: paiement.User.email,
          nom: paiement.User.nom,
          reference: paiement.reference,
          ticketNumber: paiement.id,
          formationTitre: paiement.Formation.titre
        });
        console.log('[WEBHOOK] Reçu envoyé avec succès');
        emailStatus = 'envoye';
      } catch (mailErr) {
        console.error('[WEBHOOK][ERREUR] lors de l\'envoi du mail reçu:', mailErr);
        console.error('[WEBHOOK][ERREUR] Détails:', mailErr.message);
        if (mailErr.code) console.error('[WEBHOOK][ERREUR] Code:', mailErr.code);
        if (mailErr.stack) console.error('[WEBHOOK][ERREUR] Stack:', mailErr.stack);
        emailStatus = 'erreur';
        emailError = mailErr.message;
      }
    }

    res.status(200).json({ 
      message: 'Statut mis à jour avec succès',
      ticketsDisponibles: paiement.Formation.ticketsDisponibles,
      emailStatus,
      emailError
    });
  } catch (err) {
    console.error('[WEBHOOK][ERREUR]', err);
    console.error('[WEBHOOK][ERREUR] Détails:', err.message);
    if (err.stack) console.error('[WEBHOOK][ERREUR] Stack:', err.stack);
    res.status(500).json({ 
      error: 'Erreur lors du traitement du webhook',
      details: err.message,
      emailStatus: 'non_envoye'
    });
  }
};