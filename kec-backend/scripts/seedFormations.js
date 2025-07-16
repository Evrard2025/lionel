require('dotenv').config();
const { sequelize } = require('../config/database');
const Formation = require('../models/Formation');

const formationsParDefaut = [
    /*
    {
        titre: "Masterclass Fiscalité",
        description: "Décryptez les dernières réformes fiscales et optimisez la stratégie financière de vos clients avec nos méthodes innovantes. Cette formation vous permettra de maîtriser les aspects complexes de la fiscalité moderne.",
        prix: 1000,
        duree: "3 mois",
        imageUrl: "https://images.unsplash.com/photo-1554224154-22dec7ec8818?ixlib=rb-4.0.3"
    },*/
    {
        titre: "Comptabilité d’entreprise sur logiciel SAGE SAARI",
        description: "Intégrez les technologies distribuées dans vos processus comptables pour gagner en transparence et en efficacité. Formation complète sur les dernières normes comptables et outils digitaux.",
        prix: 1000,
        duree: "2 semaines",
        imageUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?ixlib=rb-4.0.3"
    },
   /* {
        titre: "Finance Predictive",
        description: "Utilisez l'IA et le machine learning pour anticiper les tendances financières et prendre des décisions éclairées. Apprenez à utiliser les outils d'analyse prédictive dans le domaine financier.",
        prix: 1000,
        duree: "6 mois",
        imageUrl: "https://www.digispin.io/wp-content/uploads/2019/07/data-analyse-predictive-finance-digital-entreprise-1024x545.jpg"
    } */
];

async function seedFormations() {
    try {
        // Synchroniser la base de données
        await sequelize.sync();

        // Vérifier si des formations existent déjà
        const formationsExistantes = await Formation.findAll();
        
        if (formationsExistantes.length === 0) {
            // Insérer les formations par défaut
            await Formation.bulkCreate(formationsParDefaut);
            console.log('✅ Formations par défaut insérées avec succès !');
        } else {
            console.log('ℹ️ Des formations existent déjà dans la base de données.');
        }

        // Afficher toutes les formations
        const toutesLesFormations = await Formation.findAll();
        console.log('\nFormations dans la base de données :');
        toutesLesFormations.forEach(formation => {
            console.log(`\n📚 ${formation.titre}`);
            console.log(`   Prix: ${formation.prix} Fcfa`);
            console.log(`   Durée: ${formation.duree}`);
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'insertion des formations :', error);
    } finally {
        // Fermer la connexion
        await sequelize.close();
    }
}

// Exécuter le script
seedFormations(); 