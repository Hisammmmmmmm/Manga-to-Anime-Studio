import json
import os
import webbrowser
import subprocess
import sys
from pathlib import Path

# --- CONFIGURATION ---
# Adaptez ces valeurs selon votre projet réel
APP_ENTRY_POINT = "app.py"  # Remplacez par votre fichier principal (ex: main.py, studio.py, etc.)
CONFIG_PATH = Path.home() / ".manga_to_anime_config.json"
# ---------------------

def ask_for_google_config():
    """Demande à l'utilisateur comment il veut s'authentifier auprès de Google AI"""
    print("🔧 Configuration initiale de Manga-to-Anime Studio")
    print("=" * 50)
    print("Choisissez votre méthode d'authentification :")
    print("  1️⃣  Clé API Google AI Studio (recommandé pour simplicité)")
    print("  2️⃣  Compte Google (OAuth - nécessite configuration cloud préalable)")
    
    while True:
        choix = input("\nVotre choix (1 ou 2) : ").strip()
        if choix in ("1", "2"):
            break
        print("❌ Veuillez entrer 1 ou 2")

    config = {}

    if choix == "1":
        print("\n📝 Mode Clé API sélectionné")
        api_key = input("🔑 Collez votre clé API Google AI Studio ici : ").strip()
        if not api_key:
            print("❌ Clé API vide - relancez l'app pour réessayer")
            sys.exit(1)
        
        config["auth_mode"] = "api_key"
        config["api_key"] = api_key
        print("✅ Clé API enregistrée")

    else:  # choix == "2"
        print("\n🌐 Mode OAuth sélectionné")
        print("⚠️  Pour utiliser ce mode, vous devez :")
        print("   1. Créer un projet dans Google Cloud Console")
        print("   2. Activer l'API Gemini")
        print("   3. Configurer un OAuth Client ID (type application web)")
        print("   4. Définir les redirect URIs sur http://localhost:8080/callback")
        print("   5. Noter votre Client ID et Client Secret")
        print("\n💡 Si vous n'avez pas fait cela, choisissez l'option 1 (clé API) pour commencer.")
        
        # Ici, dans une vraie implémentation OAuth, vous lanceriez un serveur local
        # pour gérer le callback. Pour simplifier, on demande les tokens manuellement
        # ou on utilise un flow device code (plus adapté aux apps desktop).
        # Comme on ne voit pas votre code réel, on fait une version simplifiée :
        
        client_id = input("🔑 Votre Google OAuth Client ID : ").strip()
        client_secret = input("🔐 Votre Google OAuth Client Secret : ").strip()
        
        if not client_id or not client_secret:
            print("❌ Identifiants OAuth manquants")
            sys.exit(1)
            
        config["auth_mode"] = "oauth"
        config["client_id"] = client_id
        config["client_secret"] = client_secret
        print("✅ Identifiants OAuth enregistrés")
        print("💡 Au prochain lancement, l'app tentera d'utiliser ces identifiants")

    # Sauvegarde de la config
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        print(f"💾 Configuration sauvegardée dans : {CONFIG_PATH}")
    except Exception as e:
        print(f"⚠️  Erreur lors de la sauvegarde : {e}")

    return config

def load_config():
    """Charge la config existante ou en demande une nouvelle"""
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️  Fichier de config corrompu ({e}), nouvelle configuration demandée")
            return ask_for_google_config()
    else:
        return ask_for_google_config()

def initialize_google_client(config):
    """
    ⚠️  FONCTION À ADAPTER SELON VOTRE CODE RÉEL
    Cette fonction doit retourner un client Google AI initialisé
    selon le mode d'authentification choisi.
    """
    if config["auth_mode"] == "api_key":
        # Exemple pour Google Gemini API (Google AI Studio)
        # Vous devez adapter cela selon comment vous utilisez l'API dans votre app
        try:
            import google.generativeai as genai
            genai.configure(api_key=config["api_key"])
            print("🤖 Client Gemini AI initialisé avec clé API")
            return genai  # ou retournez un objet client spécifique si besoin
        except ImportError:
            print("❌ Package 'google-generativeai' non installé")
            print("   Installez-le avec : pip install google-generativeai")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Erreur d'initialisation Gemini : {e}")
            sys.exit(1)

    else:  # oauth
        # Pour OAuth, vous aurez besoin de récupérer un token valide
        # Cela peut être complexe selon si vous utilisez refresh tokens, etc.
        # En pratique, pour une app desktop, on utilise souvent :
        # - Le flow device code de Google (pour éviter un serveur local)
        # - Ou on demande à l'utilisateur de se logger via navigateur et on récupère le token manuellement
        # Comme cela dépend fortement de votre implémentation actuelle, voici un placeholder :
        print("🔧 Mode OAuth sélectionné - à implémenter selon votre code actuel")
        print("   Vous devez remplacer cette fonction par votre logique d'authentification OAuth réelle")
        # Exemple de ce que vous pourriez faire :
        # from google.oauth2.credentials import Credentials
        # creds = Credentials.from_authorized_user_info(info=load_user_creds())
        # return build('generativelanguage', 'v1beta', credentials=creds)
        return None  # À remplacer

def launch_your_app():
    """
    Lance votre application réelle.
    Adaptez cette fonction selon comment votre app démarre habituellement.
    """
    print("\n🚀 Lancement de votre application Manga-to-Anime Studio...")
    
    # CAS 1 : Votre app est un script Python simple (ex: app.py contient une boucle principale)
    if APP_ENTRY_POINT.endswith(".py") and Path(APP_ENTRY_POINT).exists():
        print(f"📍 Lancement de {APP_ENTRY_POINT} en tant que sous-processus")
        try:
            # On lance votre app comme un processus séparé
            # Cela permet de garder le launcher actif pour gérer les erreurs éventuelles
            process = subprocess.Popen(
                [sys.executable, APP_ENTRY_POINT],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Optionnel : afficher la sortie en temps réel
            # for line in process.stdout:
            #     print(line, end='')
            
            # Attendre la fin (ou non, selon si votre app est bloquante)
            # Si votre app lance une interface web et se termine immédiatement,
            # vous pourriez ne pas vouloir attendre ici.
            stdout, stderr = process.communicate(timeout=30)
            if stdout:
                print("📥 Sortie de l'app :", stdout[:500] + ("..." if len(stdout) > 500 else ""))
            if stderr:
                print("📥 Erreurs de l'app :", stderr[:500] + ("..." if len(stderr) > 500 else ""))
                
            if process.returncode != 0:
                print(f"⚠️  L'app s'est arrêtée avec le code {process.returncode}")
            else:
                print("✅ App terminée normalement")
                
        except FileNotFoundError:
            print(f"❌ Fichier introuvable : {APP_ENTRY_POINT}")
            print("   Vérifiez que APP_ENTRY_POINT dans launcher.py pointe vers votre fichier principal")
        except subprocess.TimeoutExpired:
            print("⏱️  L'app s'exécute toujours en arrière-plan (timeout atteint)")
            process.terminate()
        except Exception as e:
            print(f"❌ Erreur lors du lancement : {e}")

    # CAS 2 : Votre app est une interface web locale (Streamlit, Gradio, FastAPI, etc.)
    # Décommentez et adaptez la section suivante si c'est votre cas :
    """
    elif APP_ENTRY_POINT.startswith("http") or "streamlit" in APP_ENTRY_POINT or "gradio" in APP_ENTRY_POINT:
        print(f"🌐 Lancement de l'interface web : {APP_ENTRY_POINT}")
        webbrowser.open(APP_ENTRY_POINT)
        # Ici, vous auriez probablement démarré un serveur local avant d'ouvrir le navigateur
    """

    # CAS 3 : Votre app nécessite une initialisation spéciale avant de lancer
    else:
        print(f"⚠️  Mode de lancement non reconnu pour : {APP_ENTRY_POINT}")
        print("   Veuillez éditer la fonction launch_your_app() dans launcher.py")
        print("   Selon votre projet, vous pourriez avoir besoin de :")
        print("   - Importer et appeler une fonction principale directement")
        print("   - Lancer un serveur web local puis ouvrir un navigateur")
        print("   - Exécuter une série de scripts d'initialisation")

def main():
    print("🎬 Manga-to-Anime Studio - Lanceur Windows")
    print("=" * 50)
    
    # Étape 1 : Gestion de l'authentification
    config = load_config()
    
    # Étape 2 : Initialisation du client Google (à adapter à votre code)
    client = initialize_google_client(config)
    # Si votre app a besoin du client global, vous pourriez le stocker dans un module
    # Exemple : import myapp; myapp.google_client = client
    
    # Étape 3 : Lancement de votre application réelle
    launch_your_app()
    
    print("\n👋 Lancereur terminé. Votre app peut continuer à s'exécuter en arrière-plan.")

if __name__ == "__main__":
    main()
