# 🎨 Manga-to-Anime Studio

Transformez vos pages de manga noir et blanc en clips d'anime colorisés et animés grâce à la puissance de l'IA (Gemini & Veo).

![Version](https://img.shields.io/badge/version-2.1.0--colorized-indigo)
![License](https://img.shields.io/badge/license-Apache--2.0-emerald)

## 🚀 Fonctionnalités Clés

### 1. 📖 Bible des Personnages (Contexte Intelligent)
Garantissez la cohérence visuelle de vos personnages à travers toutes les cases.
- **Extraction PDF :** Uploadez un tome ou un chapitre en PDF pour que l'IA apprenne les descriptions physiques et les palettes de couleurs.
- **Recherche Internet :** Indiquez simplement le nom du manga et le chapitre, l'IA récupère les informations canoniques sur le web.

### 2. 🔍 Analyse & Découpage Automatique
- **Segmentation :** Détection automatique des cases (panels) de la page.
- **OCR & Traduction :** Extraction des dialogues et traduction instantanée dans la langue de votre choix.
- **Scripting :** Génération d'un script détaillé pour chaque case, décrivant l'action et l'ambiance.

### 3. 🎨 Colorisation 16:9 (Cinématique)
- **Format Anime :** Transformation des cases verticales du manga en format paysage 16:9.
- **Inpainting Intelligent :** L'IA complète les bords manquants pour éviter les bandes noires et créer une immersion totale.
- **Fidélité :** Utilisation de la Bible des Personnages pour appliquer les bonnes couleurs (cheveux, yeux, vêtements).

### 4. 🎬 Animation Veo 3.1
- **Mouvement Fluide :** Génération de clips vidéo basés sur les frames colorisées.
- **Contrôle Créatif :** Modifiez les prompts de début et de fin pour orienter l'animation.
- **Batch Processing :** Lancez la génération de toutes les vidéos en un clic.

### 5. 🌍 Multi-langue & Export
- **Interface :** Support complet du Français, Anglais, Espagnol, Arabe, Japonais, Chinois et Coréen.
- **Export ZIP :** Récupérez toutes vos images et vidéos dans une archive organisée.

---

## 🏗️ Architecture Technique

L'application est bâtie sur une architecture moderne et performante :

- **Frontend :** React 18 avec TypeScript pour une interface robuste.
- **Styling :** Tailwind CSS pour un design "Dark Mode" cinématique et réactif.
- **IA (Cerveau) :** 
  - **Gemini 3.1 Pro :** Analyse de page, OCR, segmentation et scripting.
  - **Gemini 2.5 Flash :** Extraction de contexte et recherche internet.
  - **Gemini 2.5 Flash Image :** Colorisation et inpainting 16:9.
  - **Veo 3.1 :** Génération de vidéo haute fidélité.
- **Gestion de fichiers :** JSZip pour la compression des exports et File-Saver pour le téléchargement.

## 🛠️ Installation & Déploiement

### Pré-requis
- Node.js 18+
- Une clé API Google AI Studio (Gemini)

### Installation locale
1. Clonez le dépôt.
2. Installez les dépendances : `npm install`.
3. Créez un fichier `.env` à la racine et ajoutez votre clé : `VITE_GEMINI_API_KEY=votre_cle`.
4. Lancez le serveur : `npm run dev`.

### Déploiement
L'application est optimisée pour être déployée sur des plateformes comme Vercel, Netlify ou Cloud Run.

---

## 📖 Tutoriel d'utilisation

### Étape 1 : Configuration
Ouvrez le panneau **Paramètres** (icône engrenage) pour choisir vos modèles d'IA préférés et la langue cible pour la traduction des dialogues.

### Étape 2 : Définir le Contexte
Dans la section **Bible des Personnages** :
- Soit glissez-déposez un fichier PDF contenant des références.
- Soit saisissez le nom du manga (ex: "One Piece") et le chapitre pour une recherche automatique.
*Cette étape est cruciale pour que l'IA sache que Luffy a un chapeau de paille jaune et un gilet rouge !*

### Étape 3 : Uploader la Page
Glissez votre page de manga (JPG ou PNG) dans la zone centrale.

### Étape 4 : Lancer le Workflow
Cliquez sur **"Extraire & Coloriser"**. Le pipeline s'affiche à gauche :
1. **Analyse :** L'IA découpe la page et traduit les textes.
2. **Colorisation :** Les frames 16:9 sont générées pour chaque case.

### Étape 5 : Animation & Export
- Parcourez les cases extraites à droite.
- Cliquez sur **"Générer Vidéo"** pour chaque case ou utilisez **"Générer toutes les vidéos"** en haut.
- Une fois terminé, cliquez sur **"Exporter le projet"** pour télécharger votre travail.

---

## 🛠️ Installation Technique

```bash
# Cloner le dépôt
git clone https://github.com/votre-repo/manga-to-anime-studio.git

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

## 🔑 Configuration des API
L'application utilise le SDK `@google/genai`. Assurez-vous d'avoir une clé API Gemini valide configurée dans votre environnement.

---

## 📄 Licence
Distribué sous la licence Apache 2.0. Voir `LICENSE` pour plus d'informations.
