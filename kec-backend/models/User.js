const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const validator = require('validator');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le nom est requis' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Email invalide' },
      notEmpty: { msg: "L'email est requis" }
    }
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le numéro de téléphone est requis' }
    }
  },
  niveauEtude: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Le niveau d'étude est requis" }
    }
  },
  formationChoisie: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La formation est requise' }
    }
  },
  dateInscription: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

module.exports = User;