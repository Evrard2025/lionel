from locust import HttpUser, task, between
import random
import string

class KECUser(HttpUser):
    wait_time = between(2, 5)  # Plus d'espacement entre les requêtes

    def generate_unique_email(self):
        # Génère un email unique à chaque appel
        unique_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
        return f"testuser_{unique_id}@example.com"

    @task(3)
    def get_formations(self):
        # Test de la route principale des formations
        self.client.get("/api/formations")

    @task(2)
    def post_inscription(self):
        # Test d'inscription d'utilisateur
        payload = {
            "nom": f"Test User {random.randint(1, 1000)}",
            "email": self.generate_unique_email(),
            "telephone": f"0123456{random.randint(100, 999)}",
            "niveauEtude": random.choice(["Bac", "Licence", "Master", "Doctorat"]),
            "formationChoisie": "1"
        }
        self.client.post("/api/users", json=payload)

    @task(1)
    def post_paiement(self):
        # Test de création de paiement avec montant fixe de 1000
        # Le modèle Paiement nécessite userId et formationId
        payload = {
            "userId": random.randint(1, 10),  # ID utilisateur aléatoire
            "formationId": 1,  # Formation fixée à 1
            "montant": 1000,
            "modePaiement": "Test",
            "statut": "payé"
        }
        self.client.post("/api/paiements", json=payload)

# Pour lancer le test avec une charge plus raisonnable :
# locust -f locustfile.py --headless -u 100 -r 10 --run-time 2m --host http://localhost:5000
