const { Sequelize } = require('sequelize');
require('dotenv').config();

// Ancienne configuration sans SSL :
/*
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Mettre à true pour voir les requêtes SQL dans la console
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
*/

// Nouvelle configuration avec SSL pour Aiven/PostgreSQL Cloud
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Mettre à true pour voir les requêtes SQL dans la console
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Pour Aiven, Heroku, etc.
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test de la connexion et synchronisation des modèles
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à PostgreSQL établie avec succès.');
    
    // Synchroniser les modèles avec la base de données
    // force: true va recréer les tables (attention en production!)
    await sequelize.sync({ alter: true });
    console.log('Base de données synchronisée avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
};

module.exports = {
  sequelize,
  initDatabase
}; 