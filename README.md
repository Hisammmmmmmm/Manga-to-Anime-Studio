# 🎨 Manga-to-Anime Studio

Transform your black and white manga pages into colorized and animated anime clips using the power of AI (Gemini & Veo).

![Version](https://img.shields.io/badge/version-2.1.0--colorized-indigo)
![License](https://img.shields.io/badge/license-Apache--2.0-emerald)

## 🚀 Key Features

### 1. 📖 Character Bible (Smart Context)
Ensure visual consistency of your characters across all panels.
- **PDF Extraction:** Upload a volume or chapter in PDF format for the AI to learn physical descriptions and color palettes.
- **Internet Search:** Simply enter the manga name and chapter, and the AI retrieves canonical information from the web.

### 2. 🔍 Automatic Analysis & Segmentation
- **Segmentation:** Automatic detection of panels on the page.
- **OCR & Translation:** Dialogue extraction and instant translation into your chosen language.
- **Scripting:** Generation of a detailed script for each panel, describing the action and atmosphere.

### 3. 🎨 16:9 Colorization (Cinematic)
- **Anime Format:** Transformation of vertical manga panels into 16:9 landscape format.
- **Smart Inpainting:** The AI fills in missing edges to avoid black bars and create total immersion.
- **Fidelity:** Uses the Character Bible to apply the correct colors (hair, eyes, clothing).

### 4. 🎬 Veo 3.1 Animation
- **Fluid Movement:** Generation of video clips based on colorized frames.
- **Creative Control:** Edit start and end prompts to guide the animation.
- **Batch Processing:** Start generating all videos with a single click.

### 5. 🌍 Multi-language & Export
- **Interface:** Full support for French, English, Spanish, Arabic, Japanese, Chinese, and Korean.
- **ZIP Export:** Retrieve all your images and videos in an organized archive.

---

## 🏗️ Technical Architecture

The application is built on a modern and high-performance architecture:

- **Frontend:** React 18 with TypeScript for a robust interface.
- **Styling:** Tailwind CSS for a cinematic and responsive "Dark Mode" design.
- **AI (Brain):** 
  - **Gemini 3.1 Pro:** Page analysis, OCR, segmentation, and scripting.
  - **Gemini 2.5 Flash:** Context extraction and internet search.
  - **Gemini 2.5 Flash Image:** 16:9 colorization and inpainting.
  - **Veo 3.1:** High-fidelity video generation.
- **File Management:** JSZip for export compression and File-Saver for downloads.

---

## 📖 User Tutorial

### Step 1: Configuration
Open the **Settings** panel (gear icon) to choose your preferred AI models and the target language for dialogue translation.

### Step 2: Define Context
In the **Character Bible** section:
- Either drag and drop a PDF file containing references.
- Or enter the manga name (e.g., "One Piece") and chapter for an automatic search.
*This step is crucial so the AI knows Luffy has a yellow straw hat and a red vest!*

### Step 3: Upload the Page
Drag your manga page (JPG or PNG) into the central area.

### Step 4: Start the Workflow
Click on **"Extract & Colorize"**. The pipeline will be displayed on the left:
1. **Analysis:** The AI segments the page and translates the text.
2. **Colorization:** 16:9 frames are generated for each panel.

### Step 5: Animation & Export
- Browse the extracted panels on the right.
- Click **"Generate Video"** for each panel or use **"Generate all videos"** at the top.
- Once finished, click **"Export project"** to download your work.

---

## 🛠️ Installation & Deployment

### Prerequisites
- Node.js 18+
- A Google AI Studio API Key (Gemini)

### Local Installation
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Create a `.env` file in the root and add your key: `VITE_GEMINI_API_KEY=your_key`.
4. Start the server: `npm run dev`.

### Deployment
The application is optimized for deployment on platforms like Vercel, Netlify, or Cloud Run.

---

## 📄 License
Distributed under the Apache 2.0 License. See `LICENSE` for more information.
