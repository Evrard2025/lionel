const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Formation = sequelize.define('Formation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Le titre est requis' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La description est requise' }
    }
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le prix est requis' },
      min: { args: [0], msg: 'Le prix ne peut pas être négatif' }
    }
  },
  duree: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La durée est requise' }
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ticketsTotal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3000,
    validate: {
      min: { args: [0], msg: 'Le nombre total de tickets ne peut pas être négatif' }
    }
  },
  ticketsDisponibles: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3000,
    validate: {
      min: { args: [0], msg: 'Le nombre de tickets disponibles ne peut pas être négatif' }
    }
  }
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  createdAt: 'dateCreation' // Renomme createdAt en dateCreation
});

module.exports = Formation;