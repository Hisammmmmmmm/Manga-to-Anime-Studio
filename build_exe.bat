@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo 🎬 Manga-to-Anime Studio - Build Automatique
echo ======================================================

echo.
echo 📦 1. Verification des dependances Node.js...
if not exist node_modules (
    echo 📥 Installation des packages npm (cela peut prendre un moment)...
    call npm install
) else (
    echo ✅ node_modules deja present.
)

echo.
echo 🏗️ 2. Compilation de l'application React (Vite)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la compilation React !
    pause
    exit /b %ERRORLEVEL%
)
echo ✅ Dossier 'dist' cree avec succes.

echo.
echo 🐍 3. Preparation de l'environnement Python...
if not exist venv (
    echo 🛠️ Creation de l'environnement virtuel...
    python -m venv venv
)
call venv\Scripts\activate

echo.
echo 📦 4. Installation des dependances Python...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo 🚀 5. Creation de l'executable Windows...
:: On utilise PyInstaller pour creer l'executable
:: Note: On ne met pas --onefile ici pour que l'exe puisse trouver app.py et dist facilement
pyinstaller --noconfirm --onedir --name "MangaToAnimeStudio" --console launcher.py

echo.
echo 📂 6. Copie des fichiers necessaires...
echo 📄 Copie de app.py...
copy /Y app.py dist\MangaToAnimeStudio\app.py
echo 📁 Copie du dossier dist (React)...
xcopy /E /I /Y dist dist\MangaToAnimeStudio\dist

echo.
echo ======================================================
echo ✅ TERMINE AVEC SUCCES !
echo ======================================================
echo.
echo 📍 Votre application prete a l'emploi se trouve dans :
echo    dist\MangaToAnimeStudio\
echo.
echo 💡 Pour lancer l'application :
echo    Double-cliquez sur 'MangaToAnimeStudio.exe' dans ce dossier.
echo.
pause
