// Configuration de l'API
const isProduction = window.location.hostname === 'www.kectombolaformation.com'; // Ou d'autres conditions pour la production
const API_URL = isProduction 
    ? 'https://lionel-bzdx.onrender.com/api' // Utiliser HTTPS en production (fortement recommandé)
    : 'http://localhost:5000/api'; // Utiliser le port de développement local

console.log(`Using API URL: ${API_URL}`); // Ajout d'un log pour vérifier l'URL utilisée

// Fonction pour vérifier le statut du paiement
async function verifierStatutPaiement(reference) {
    try {
        const response = await fetch(`${API_URL}/paiements/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reference: reference,
                status: 'success'
            })
        });

        const data = await response.json();
        
        // Créer ou mettre à jour le message de statut
        let statusMessage = document.getElementById('payment-status-message');
        if (!statusMessage) {
            statusMessage = document.createElement('div');
            statusMessage.id = 'payment-status-message';
            statusMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 1000;
                animation: slideIn 0.5s ease-out;
            `;
            document.body.appendChild(statusMessage);
        }

        // Gestion des statuts de paiement
        if (data.statut === 'payé' || data.emailStatus === 'envoye') {
            statusMessage.style.backgroundColor = '#4CAF50';
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span>Reçu envoyé avec succès ! Vérifiez votre boîte mail.</span>
                </div>
                <div style='font-size:0.95em;margin-top:6px;'>Statut: payé<br>Dernière mise à jour: ${new Date().toLocaleString()}</div>
            `;
        } else if (data.statut === 'échoué' || data.status === 'failed' || data.emailStatus === 'erreur') {
            statusMessage.style.backgroundColor = '#f44336';
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Paiement échoué ou annulé. Votre ticket n'a pas été réservé. Veuillez réessayer.</span>
                </div>
                <div style='font-size:0.95em;margin-top:6px;'>Statut: échoué<br>Dernière mise à jour: ${new Date().toLocaleString()}</div>
            `;
        } else if (data.statut === 'en_attente' || data.status === 'pending') {
            statusMessage.style.backgroundColor = '#ff9800';
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" fill="none"/>
                        <path d="M12 6v6l4 2" stroke="#fff" stroke-width="2" fill="none"/>
                    </svg>
                    <span>Paiement en attente de validation. Merci de patienter ou contactez le support si le problème persiste.</span>
                </div>
                <div style='font-size:0.95em;margin-top:6px;'>Statut: en attente<br>Dernière mise à jour: ${new Date().toLocaleString()}</div>
            `;
            // Si le paiement reste en attente plus de 30 secondes, propose de réessayer
            setTimeout(() => {
                if (document.getElementById('payment-status-message')) {
                    statusMessage.style.backgroundColor = '#d32f2f';
                    statusMessage.innerHTML = `
                        <div style='font-size:1.1em;font-weight:600;'>Le paiement est toujours en attente après 30 secondes.<br>Veuillez réessayer ou contacter le support.</div>
                    `;
                }
            }, 30000);
        }

        // Ajouter l'animation de disparition
        setTimeout(() => {
            statusMessage.style.animation = 'slideOut 0.5s ease-in forwards';
            setTimeout(() => {
                statusMessage.remove();
                // Forcer le rechargement de la page après la notification
                window.location.reload();
            }, 500);
        }, 5000);

    } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        showToast('Erreur lors de la vérification du paiement', 'error');
        setTimeout(() => window.location.reload(), 2000);
    }
}

// Ajouter les styles d'animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Fonction pour charger la formation depuis le backend
async function chargerFormation() {
    try {
        const response = await fetch(`${API_URL}/formations/1`);
        
        if (!response.ok) {
            // Read the response body to get the error message from the backend
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const formation = await response.json();
        
        // Mise à jour des informations de la formation
        const formationInfo = document.createElement('div');
        formationInfo.className = 'formation-info';
        formationInfo.innerHTML = `
            <h2>${formation.titre}</h2>
            <!-- <p class="subtitle">${formation.description}</p> -->
            <p class="tickets-info">Tickets disponibles: ${formation.ticketsDisponibles}/${formation.ticketsTotal}</p>
            <p class="price-info">Prix: ${formation.prix} Fcfa</p>
            <p class="duration-info">Durée: ${formation.duree}</p>
        `;

        // Insérer les informations de formation avant le formulaire
        const form = document.querySelector('.cta-form');
        form.parentNode.insertBefore(formationInfo, form);

        // Mettre à jour le bouton si les tickets sont épuisés
        const submitButton = form.querySelector('button[type="submit"]');
        if (formation.ticketsDisponibles <= 0) {
            submitButton.disabled = true;
            submitButton.textContent = 'Tickets épuisés';
        }

        // Mettre à jour les cartes de formation
        const cardsContainer = document.querySelector('.cards-container');
        cardsContainer.innerHTML = `
            <div class="card card-flex">
                <div class="card-content">
                    <h3 class="card-title">${formation.titre}</h3>
                    <p class="card-text">${formation.description}</p>
                    <p class="card-text">Prix: ${formation.prix} Fcfa</p>
                    <p class="card-text">Durée: ${formation.duree}</p>
                    <p class="card-text tickets-info">Tickets disponibles: ${formation.ticketsDisponibles}/${formation.ticketsTotal}</p>
                    <button onclick="document.querySelector('.cta-form').scrollIntoView({behavior: 'smooth'})"
                            class="card-button"
                            ${formation.ticketsDisponibles <= 0 ? 'disabled' : ''}>
                        ${formation.ticketsDisponibles <= 0 ? 'Tickets épuisés' : 'S\'inscrire maintenant'}
                    </button>
                </div>
                <div class="card-image-container">
                    <img src="tombola.jpg" alt="Tombola Affiche" class="card-image-tombola">
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erreur lors du chargement de la formation:', error);
        // Display error message on the page instead of alert
        const errorElement = document.createElement('div');
        errorElement.style.cssText = 'color: red; text-align: center; margin-top: 20px;';
        errorElement.textContent = `Erreur lors du chargement de la formation: ${error.message}`; // Use error.message
        const form = document.querySelector('.cta-form');
        if (form) {
             form.parentNode.insertBefore(errorElement, form);
        } else {
            document.body.appendChild(errorElement);
        }

    }
}

// Fonction pour gérer l'inscription
async function handleInscription(event) {
    event.preventDefault();
    
    const formData = {
        nom: document.querySelector('input[placeholder="Votre nom complet"]').value,
        email: document.querySelector('input[placeholder="Votre email professionnel"]').value,
        telephone: document.querySelector('input[placeholder="Votre numéro de téléphone"]').value,
        niveauEtude: document.querySelector('input[name="niveauEtude"]').value,
        formationChoisie: '1' // ID fixe de la formation
    };

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Afficher une notification toast stylée
            showToast('Inscription réussie ! Redirection vers le paiement...', 'success');
            // Rediriger automatiquement après 2 secondes
            setTimeout(() => {
                initierPaiement(data.id);
            }, 2000);
        } else {
            showToast(data.error || 'Erreur lors de l\'inscription', 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        showToast('Erreur lors de l\'inscription', 'error');
    }
}

// Fonction toast stylée
function showToast(message, type = 'success') {
    // Supprimer tout toast existant
    const oldToast = document.getElementById('kec-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'kec-toast';
    toast.style.position = 'fixed';
    toast.style.top = '30px';
    toast.style.right = '30px';
    toast.style.zIndex = '9999';
    toast.style.padding = '18px 32px';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '1.1rem';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '12px';
    toast.style.color = '#fff';
    toast.style.background = type === 'success' ? '#4CAF50' : 'linear-gradient(90deg, #f44336, #b71c1c)';
    toast.style.border = type === 'success' ? '2px solid #388e3c' : '2px solid #f44336';
    toast.innerHTML = type === 'success'
        ? `<svg width="28" height="28" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" fill="none"/><path d="M8 12l2 2l4-4" stroke="#fff" stroke-width="2" fill="none"/></svg><span>${message}</span>`
        : `<svg width="28" height="28" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" fill="none"/><path d="M12 8v4m0 4h.01" stroke="#fff" stroke-width="2" fill="none"/></svg><span>${message}</span>`;
    document.body.appendChild(toast);
    // Disparition automatique
    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s, transform 0.5s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-30px)';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

// Fonction pour initier le paiement
async function initierPaiement(userId) {
    try {
        const response = await fetch(`${API_URL}/paiements/initier`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                formationId: 1 // ID fixe de la formation
            })
        });

        const data = await response.json();

        if (response.ok && data.checkoutUrl) {
            // Redirection automatique et rapide vers la plateforme de paiement
            window.location.href = data.checkoutUrl;
        } else {
            alert(data.error || 'Erreur lors de l\'initialisation du paiement');
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du paiement:', error);
        alert('Erreur lors de l\'initialisation du paiement');
    }
}

// Ajout d'un écouteur pour réinitialiser la page après succès du paiement (reçu envoyé)
window.addEventListener('DOMContentLoaded', () => {
    // Gestion du formulaire d'inscription
    const form = document.querySelector('.cta-form');
    if (form) {
        form.addEventListener('submit', handleInscription);
    }

    // Vérifie si on revient de la plateforme de paiement avec un paramètre de succès
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('paiement') && urlParams.get('paiement') === 'success' && urlParams.has('reference')) {
        // Vérifie le statut du paiement et réinitialise la page après succès
        verifierStatutPaiement(urlParams.get('reference')).then(() => {
            // Réinitialise le formulaire et la page après 2 secondes
            setTimeout(() => {
                if (form) form.reset();
                window.location.href = window.location.pathname;
            }, 2000);
        });
    }

    // Chargement de la formation
    chargerFormation();
}); 