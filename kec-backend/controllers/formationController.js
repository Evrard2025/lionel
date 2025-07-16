const Formation = require('../models/Formation');

// Récupérer toutes les formations
exports.getAllFormations = async (req, res) => {
  try {
    const formations = await Formation.findAll({
      order: [['dateCreation', 'DESC']]
    });
    res.status(200).json(formations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Créer une formation
exports.createFormation = async (req, res) => {
  try {
    const newFormation = await Formation.create(req.body);
    res.status(201).json(newFormation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Récupérer une formation par son ID
exports.getFormationById = async (req, res) => {
  try {
    const formation = await Formation.findByPk(req.params.id);
    // If no formation is found with the given ID, return a 404 response.
    if (!formation) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }
    res.status(200).json(formation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour une formation
exports.updateFormation = async (req, res) => {
  try {
    const formation = await Formation.findByPk(req.params.id);
    if (!formation) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }
    await formation.update(req.body);
    res.status(200).json(formation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Supprimer une formation
exports.deleteFormation = async (req, res) => {
  try {
    const formation = await Formation.findByPk(req.params.id);
    if (!formation) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }
    await formation.destroy();
    res.status(200).json({ message: 'Formation supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};