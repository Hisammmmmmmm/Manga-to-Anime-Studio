@echo off
echo 🔧 Preparation de l'environnement de build...
python -m venv venv
call venv\Scripts\activate
echo 📦 Installation des dependances...
pip install -r requirements.txt
echo 🚀 Creation de l'executable Windows...
pyinstaller --onefile --name "MangaToAnimeStudio" launcher.py
echo ✅ Termine ! L'executable se trouve dans le dossier 'dist'
pause
