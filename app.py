import json
import os
import webbrowser
from pathlib import Path
from flask import Flask, send_from_directory, jsonify

# --- CONFIGURATION ---
CONFIG_PATH = Path.home() / ".manga_to_anime_config.json"
# Le dossier 'dist' contient votre application React compilée
# Assurez-vous d'avoir lancé 'npm run build' avant de compiler l'exe
DIST_DIR = Path(__file__).parent / "dist"
# ---------------------

app = Flask(__name__, static_folder=str(DIST_DIR))

def load_config():
    """Charge la clé API depuis le fichier de config du launcher"""
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@app.route("/")
def serve_index():
    """Sert le fichier index.html principal"""
    if DIST_DIR.exists():
        return send_from_directory(str(DIST_DIR), "index.html")
    else:
        return "<h1>⚠️ Dossier 'dist' introuvable !</h1><p>Veuillez compiler votre application React avec <code>npm run build</code> avant de lancer l'exécutable.</p>"

@app.route("/<path:path>")
def serve_static(path):
    """Sert les fichiers statiques (JS, CSS, images)"""
    return send_from_directory(str(DIST_DIR), path)

@app.route("/api/status")
def get_status():
    """Endpoint pour vérifier que le backend est vivant"""
    config = load_config()
    return jsonify({
        "status": "running",
        "auth_mode": config.get("auth_mode", "unknown"),
        "api_key_configured": "api_key" in config
    })

def main():
    print("🚀 Serveur Manga-to-Anime Studio démarré sur http://localhost:5000")
    
    # On ouvre le navigateur automatiquement
    webbrowser.open("http://localhost:5000")
    
    # On lance le serveur Flask
    # Note: debug=False est important pour l'exécutable final
    app.run(host="127.0.0.1", port=5000, debug=False)

if __name__ == "__main__":
    main()
