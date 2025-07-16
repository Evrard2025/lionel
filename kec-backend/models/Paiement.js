const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Formation = require('./Formation');

const Paiement = sequelize.define('Paiement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  formationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Formation,
      key: 'id'
    }
  },
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le montant est requis' },
      min: { args: [0], msg: 'Le montant doit être positif' }
    }
  },
  datePaiement: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  modePaiement: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le mode de paiement est requis' }
    }
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'payé', 'échoué'),
    defaultValue: 'en_attente'
  },
  reference: {
    type: DataTypes.STRING,
    unique: true
  }
}, {
  timestamps: true
});

// Établir les relations
Paiement.belongsTo(User, { foreignKey: 'userId', as: 'User' });
User.hasMany(Paiement, { foreignKey: 'userId', as: 'paiements' });

Paiement.belongsTo(Formation, { foreignKey: 'formationId', as: 'Formation' });
Formation.hasMany(Paiement, { foreignKey: 'formationId', as: 'paiements' });

module.exports = Paiement;