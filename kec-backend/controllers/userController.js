const User = require('../models/User');
const Paiement = require('../models/Paiement');

// Inscription utilisateur
exports.registerUser = async (req, res) => {
  try {
    const { nom, email, telephone, niveauEtude, formationChoisie } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const newUser = await User.create({
      nom,
      email,
      telephone,
      niveauEtude,
      formationChoisie
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Récupérer les infos utilisateur
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Paiement,
        as: 'paiements'
      }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};