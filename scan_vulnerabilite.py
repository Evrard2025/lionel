import subprocess
import os
import sys

def run_cmd(cmd, cwd=None):
    print(f"\n[+] Exécution: {' '.join(cmd)} (dossier: {cwd or os.getcwd()})")
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=300)
        print(result.stdout)
        if result.stderr:
            print("[stderr]", result.stderr)
    except Exception as e:
        print(f"Erreur lors de l'exécution de {cmd}: {e}")

def scan_npm_audit(backend_path):
    print("\n=== Audit sécurité des dépendances Node.js (npm audit) ===")
    run_cmd(['npm', 'audit', '--audit-level=high'], cwd=backend_path)

def scan_bandit_python(path):
    print("\n=== Scan sécurité Python (bandit) ===")
    run_cmd(['bandit', '-r', path])

def scan_nmap(host, ports="80,443,5000,5502"):
    print("\n=== Scan de ports (nmap) ===")
    run_cmd(['nmap', '-sV', '-p', ports, host])

def scan_nikto(url):
    print("\n=== Scan vulnérabilité web (nikto) ===")
    run_cmd(['nikto', '-h', url])

def scan_owasp_zap(url):
    print("\n=== Scan vulnérabilité web (OWASP ZAP) ===")
    run_cmd(['zap-cli', 'quick-scan', '--self-contained', url])

def test_charge_locust(locustfile, host):
    print("\n=== Test de charge (locust) ===")
    run_cmd(['locust', '-f', locustfile, '--headless', '-u', '50', '-r', '10', '--run-time', '1m', '--host', host])

if __name__ == "__main__":
    # Chemins relatifs
    backend_path = os.path.join(os.getcwd(), "kec-backend")
    frontend_path = os.path.join(os.getcwd(), "front")
    python_code_path = os.getcwd()

    # 1. Audit sécurité backend Node.js
    scan_npm_audit(backend_path)

    # 2. Scan sécurité Python (optionnel)
    scan_bandit_python(python_code_path)

    # 3. Scan de ports backend local (adapter l'IP si besoin)
    scan_nmap("127.0.0.1", ports="5000,5502,80,443")

    # 4. Scan vulnérabilité web frontend (adapter l'URL si besoin)
    frontend_url = "http://localhost:5502"  # ou le port où tourne ton front
    try:
        scan_nikto(frontend_url)
    except Exception:
        print("Nikto non installé ou erreur, essaie OWASP ZAP si dispo.")
        try:
            scan_owasp_zap(frontend_url)
        except Exception:
            print("OWASP ZAP non installé.")

    # 5. Test de charge backend (nécessite un locustfile.py adapté)
    locustfile = os.path.join(backend_path, "locustfile.py")
    if os.path.exists(locustfile):
        test_charge_locust(locustfile, "http://localhost:5000")
    else:
        print("Aucun locustfile.py trouvé pour le test de charge.")

    print("\n=== Fini. Pense à vérifier les rapports ci-dessus. ===")