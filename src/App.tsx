/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, CheckCircle, Loader2, Image as ImageIcon, FileText, Video, Wand2, AlertCircle, RefreshCw, Palette, Download, Settings, Pencil, MessageSquare, Archive, Users, File, ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen, Globe, List, MonitorPlay, Copy, Check, Search, HelpCircle, ChevronRight, X, ArrowUp, Layout } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { analyzeMangaPage, generateAnimeFrame, generateVideo, editAnimeFrame, extractCharacterBible, searchCharacterBible } from './lib/ai';

// Declare the aistudio global for TypeScript
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
}

interface PanelData {
  id: string;
  speaker: string;
  dialogue: string;
  boundingBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  croppedImageUrl?: string;
  firstFramePrompt: string;
  lastFramePrompt: string;
  videoPrompt: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  videoUrl?: string;
  isGeneratingFirst?: boolean;
  isGeneratingLast?: boolean;
  isGeneratingVideo?: boolean;
  isEditingFirst?: boolean;
  isEditingLast?: boolean;
  editPromptFirst?: string;
  editPromptLast?: string;
  showPromptFirst?: boolean;
  showPromptLast?: boolean;
  error?: string;
  isCollapsed?: boolean;
  animationChoice?: 'veo' | 'grok' | 'kling';
  isAnimationOptionsOpen?: boolean;
  isEditingVideoPrompt?: boolean;
}

const translations = {
  fr: {
    title: "Manga-to-Anime Studio",
    subtitle: "Workflow automatisé : Extraction, Colorisation 16:9 sans bandes noires & Animation.",
    errorTitle: "Erreur du Workflow",
    settings: "Paramètres",
    uiLanguage: "Langue de l'interface",
    targetLanguage: "Langue cible (Traduction)",
    analysisModel: "Modèle Analyse",
    bibleModel: "Modèle Bible",
    imageModel: "Modèle Image",
    videoModel: "Modèle Vidéo",
    bibleSection: "1. Bible des Personnages (Optionnel)",
    uploadPdf: "Uploadez un PDF (ex: Tome 1) pour extraire les descriptions des personnages.",
    extractBible: "Extraire la Bible",
    extracting: "Extraction...",
    bibleExtracted: "Bible extraite",
    pageSection: "2. Page à coloriser",
    uploadImage: "Cliquez pour uploader une image",
    supportedFormats: "Formats supportés: JPG, PNG",
    change: "Changer",
    process: "Extraire & Coloriser",
    processWithContext: "Extraire & Coloriser (avec Contexte)",
    processing: "Traitement en cours...",
    pipeline: "Pipeline d'Exécution",
    generateAllVideos: "Générer toutes les vidéos",
    exportProject: "Exporter le projet",
    uploadPrompt: "Uploadez une page et lancez le workflow pour voir l'analyse et les cases extraites.",
    globalScript: "Script Global & Analyse",
    extractedPanels: "Cases Extraites",
    panel: "Case",
    generateVideo: "Générer Vidéo",
    videoGenerated: "Vidéo Générée",
    generating: "Génération...",
    pause: "Pause",
    resume: "Reprendre",
    step1Title: "Analyse & Extraction",
    step1Desc: "Script global & Découpage",
    step2Title: "Colorisation & 16:9",
    step2Desc: "Génération First/Last Frames",
    step3Title: "Génération Vidéo",
    step3Desc: "Animation Veo (Optionnel)",
    expandPanel: "Développer le panneau",
    collapsePanel: "Réduire le panneau",
    manualGrok: "Manuellement avec Grok",
    manualKling: "Manuellement avec Kling AI",
    autoVeo: "Automatiquement avec VEO",
    manualInstructions: "Connectez-vous à votre compte, générez une vidéo en 16:9, puis copiez les images et le prompt de la scène.",
    colors: "Couleurs",
    pageContext: "Contexte de la page",
    animeScript: "Script Anime",
    originalPanel: "Case Originale Extraite",
    copied: "Copié !",
    copyImage: "Copier l'image",
    editPromptPlaceholder: "Prompt de modification...",
    confirm: "Valider",
    generationPrompt: "Prompt de génération :",
    detailedVideoPrompt: "Prompt Vidéo Détaillé",
    veoGenerating: "Génération Veo...",
    cancel: "Annuler",
    openGrok: "Ouvrir Grok Imagine",
    openKling: "Ouvrir Kling AI",
    close: "Fermer",
    french: "Français",
    english: "Anglais",
    spanish: "Espagnol",
    arabic: "Arabe",
    japanese: "Japonais",
    chinese: "Chinois",
    korean: "Coréen",
    fast: "Rapide",
    hq: "HQ",
    firstFrame: "First Frame (Colorisée 16:9)",
    lastFrame: "Last Frame (Colorisée 16:9)",
    showPrompt: "Afficher/Modifier le prompt",
    edit: "Modifier",
    download: "Télécharger",
    regenerate: "Régénérer",
    imageNotAvailable: "Image non disponible",
    copyPrompt: "Copier le prompt",
    globalStyle: "Style Global",
    pipelineTitle: "Pipeline d'Exécution",
    contexte: "Contexte",
    errorPdf: "Veuillez uploader un fichier PDF valide.",
    errorBible: "Erreur lors de l'extraction de la bible des personnages.",
    errorApiKey: "Clé API requise pour la génération de vidéos.",
    errorCanvas: "Impossible de créer le contexte canvas.",
    errorCrop: "Erreur lors du chargement de l'image pour le recadrage.",
    errorCropProcess: "Erreur lors du recadrage.",
    errorFirstFrame: "Erreur First Frame",
    errorLastFrame: "Erreur Last Frame",
    errorProcessing: "Une erreur est survenue lors du traitement.",
    errorEditFrame: "Erreur modification frame",
    errorVideo: "Erreur vidéo",
    characters: "Personnages",
    dialogueSpoken: "Dialogue parlé",
    isSpeaking: "est en train de parler",
    mangaName: "Nom du Manga",
    chapter: "Chapitre",
    searchBible: "Rechercher sur Internet",
    searching: "Recherche...",
    or: "OU",
    tutorial: "Tutoriel",
    next: "Suivant",
    finish: "Terminer",
    skip: "Passer",
    tutStep1Title: "Bienvenue !",
    tutStep1Desc: "Ce studio transforme vos pages de manga en clips d'anime colorisés et animés.",
    tutStep2Title: "Paramètres",
    tutStep2Desc: "Configurez ici les modèles d'IA et la langue de traduction.",
    tutStep3Title: "Bible des Personnages",
    tutStep3Desc: "Uploadez un PDF ou recherchez sur internet pour garantir la cohérence des couleurs des personnages.",
    tutStep4Title: "Page Manga",
    tutStep4Desc: "Uploadez la page que vous souhaitez transformer.",
    tutStep5Title: "Lancer le Workflow",
    tutStep5Desc: "Cliquez ici pour lancer l'analyse, la colorisation et la préparation de l'animation.",
    tutStep6Title: "Résultats & Animation",
    tutStep6Desc: "Visualisez les cases extraites, modifiez les frames et générez vos vidéos finales.",
    continueStory: "Continuer l'histoire (Continuité du script)",
    scrollHint: "Le résultat se génère plus bas dans la page...",
    navBible: "Bible",
    navScript: "Script",
    navPanels: "Cases",
    navTop: "Haut",
    manualScript: "Script précédent (optionnel)",
    manualScriptPlaceholder: "Collez ici le script de la page précédente pour assurer la continuité narrative et la numérotation des scènes...",
    newGeneration: "Nouvelle Page / Réinitialiser",
    clearResults: "Effacer les résultats actuels",
    uploadScript: "Uploader un script (.txt)"
  },
  en: {
    title: "Manga-to-Anime Studio",
    subtitle: "Automated Workflow: Extraction, 16:9 Colorization & Animation.",
    errorTitle: "Workflow Error",
    settings: "Settings",
    uiLanguage: "Interface Language",
    targetLanguage: "Target Language (Translation)",
    analysisModel: "Analysis Model",
    bibleModel: "Bible Model",
    imageModel: "Image Model",
    videoModel: "Video Model",
    bibleSection: "1. Character Bible (Optional)",
    uploadPdf: "Upload a PDF (e.g., Volume 1) to extract character descriptions.",
    extractBible: "Extract Bible",
    extracting: "Extracting...",
    bibleExtracted: "Bible extracted",
    pageSection: "2. Page to Colorize",
    uploadImage: "Click to upload an image",
    supportedFormats: "Supported formats: JPG, PNG",
    change: "Change",
    process: "Extract & Colorize",
    processWithContext: "Extract & Colorize (with Context)",
    processing: "Processing...",
    pipeline: "Execution Pipeline",
    generateAllVideos: "Generate All Videos",
    exportProject: "Export Project",
    uploadPrompt: "Upload a page and start the workflow to see the analysis and extracted panels.",
    globalScript: "Global Script & Analysis",
    extractedPanels: "Extracted Panels",
    panel: "Panel",
    generateVideo: "Generate Video",
    videoGenerated: "Video Generated",
    generating: "Generating...",
    pause: "Pause",
    resume: "Resume",
    step1Title: "Analysis & Extraction",
    step1Desc: "Global script & Cropping",
    step2Title: "Colorization & 16:9",
    step2Desc: "First/Last Frames Generation",
    step3Title: "Video Generation",
    step3Desc: "Veo Animation (Optional)",
    expandPanel: "Expand panel",
    collapsePanel: "Collapse panel",
    manualGrok: "Manually with Grok",
    manualKling: "Manually with Kling AI",
    autoVeo: "Automatically with VEO",
    manualInstructions: "Connect to your account, generate a 16:9 video, then copy the images and the scene prompt.",
    colors: "Colors",
    pageContext: "Page Context",
    animeScript: "Anime Script",
    originalPanel: "Original Extracted Panel",
    copied: "Copied!",
    copyImage: "Copy Image",
    editPromptPlaceholder: "Edit prompt...",
    confirm: "Confirm",
    generationPrompt: "Generation Prompt:",
    detailedVideoPrompt: "Detailed Video Prompt",
    veoGenerating: "Veo Generating...",
    cancel: "Cancel",
    openGrok: "Open Grok Imagine",
    openKling: "Open Kling AI",
    close: "Close",
    french: "French",
    english: "English",
    spanish: "Spanish",
    arabic: "Arabic",
    japanese: "Japanese",
    chinese: "Chinese",
    korean: "Korean",
    fast: "Fast",
    hq: "HQ",
    firstFrame: "First Frame (Colorized 16:9)",
    lastFrame: "Last Frame (Colorized 16:9)",
    showPrompt: "Show/Edit prompt",
    edit: "Edit",
    download: "Download",
    regenerate: "Regenerate",
    imageNotAvailable: "Image not available",
    copyPrompt: "Copy prompt",
    globalStyle: "Global Style",
    pipelineTitle: "Execution Pipeline",
    contexte: "Context",
    errorPdf: "Please upload a valid PDF file.",
    errorBible: "Error extracting character bible.",
    errorApiKey: "API Key required for video generation.",
    errorCanvas: "Unable to create canvas context.",
    errorCrop: "Error loading image for cropping.",
    errorCropProcess: "Error during cropping.",
    errorFirstFrame: "First Frame Error",
    errorLastFrame: "Last Frame Error",
    errorProcessing: "An error occurred during processing.",
    errorEditFrame: "Error editing frame",
    errorVideo: "Video error",
    characters: "Characters",
    dialogueSpoken: "Dialogue spoken",
    isSpeaking: "is speaking",
    mangaName: "Manga Name",
    chapter: "Chapter",
    searchBible: "Search Internet",
    searching: "Searching...",
    or: "OR",
    tutorial: "Tutorial",
    next: "Next",
    finish: "Finish",
    skip: "Skip",
    tutStep1Title: "Welcome!",
    tutStep1Desc: "This studio transforms your manga pages into colorized and animated anime clips.",
    tutStep2Title: "Settings",
    tutStep2Desc: "Configure AI models and translation language here.",
    tutStep3Title: "Character Bible",
    tutStep3Desc: "Upload a PDF or search the internet to ensure character color consistency.",
    tutStep4Title: "Manga Page",
    tutStep4Desc: "Upload the page you want to transform.",
    tutStep5Title: "Start Workflow",
    tutStep5Desc: "Click here to start analysis, colorization, and animation preparation.",
    tutStep6Title: "Results & Animation",
    tutStep6Desc: "View extracted panels, edit frames, and generate your final videos.",
    continueStory: "Continue Story (Script Continuity)",
    scrollHint: "The result is being generated further down the page...",
    navBible: "Bible",
    navScript: "Script",
    navPanels: "Panels",
    navTop: "Top",
    manualScript: "Previous Script (optional)",
    manualScriptPlaceholder: "Paste the script from the previous page here to ensure narrative continuity and scene numbering...",
    newGeneration: "New Page / Reset",
    clearResults: "Clear current results",
    uploadScript: "Upload script (.txt)"
  },
  es: {
    title: "Manga-to-Anime Studio",
    subtitle: "Flujo de trabajo automatizado: extracción, colorización 16:9 y animación.",
    errorTitle: "Error del flujo de trabajo",
    settings: "Ajustes",
    uiLanguage: "Idioma de la interfaz",
    targetLanguage: "Idioma de destino (Traducción)",
    analysisModel: "Modelo de análisis",
    bibleModel: "Modelo de Biblia",
    imageModel: "Modelo de imagen",
    videoModel: "Modelo de video",
    bibleSection: "1. Biblia de personajes (Opcional)",
    uploadPdf: "Sube un PDF (ej: Tomo 1) para extraer descripciones de personajes.",
    extractBible: "Extraer Biblia",
    extracting: "Extrayendo...",
    bibleExtracted: "Biblia extraída",
    pageSection: "2. Página a colorizar",
    uploadImage: "Haz clic para subir una imagen",
    supportedFormats: "Formatos soportados: JPG, PNG",
    change: "Cambiar",
    process: "Extraer y colorizar",
    processWithContext: "Extraer y colorizar (con contexto)",
    processing: "Procesando...",
    pipeline: "Línea de ejecución",
    generateAllVideos: "Generar todos los videos",
    exportProject: "Exportar proyecto",
    uploadPrompt: "Sube una página e inicia el flujo de trabajo para ver el análisis y los paneles extraídos.",
    globalScript: "Guion global y análisis",
    extractedPanels: "Paneles extraídos",
    panel: "Panel",
    generateVideo: "Generar video",
    videoGenerated: "Video generado",
    generating: "Generando...",
    pause: "Pausa",
    resume: "Reanudar",
    step1Title: "Análisis y extracción",
    step1Desc: "Guion global y recorte",
    step2Title: "Colorización y 16:9",
    step2Desc: "Generación de fotogramas inicial/final",
    step3Title: "Generación de video",
    step3Desc: "Animación Veo (Opcional)",
    expandPanel: "Expandir panel",
    collapsePanel: "Contraer panel",
    manualGrok: "Manualmente con Grok",
    manualKling: "Manualmente con Kling AI",
    autoVeo: "Automáticamente con VEO",
    manualInstructions: "Inicia sesión en tu cuenta, genera un video en 16:9 y luego copia las imágenes y el prompt de la escena.",
    colors: "Colores",
    pageContext: "Contexto de la página",
    animeScript: "Guion de anime",
    originalPanel: "Panel original extraído",
    copied: "¡Copiado!",
    copyImage: "Copiar imagen",
    editPromptPlaceholder: "Editar prompt...",
    confirm: "Confirmar",
    generationPrompt: "Prompt de generación:",
    detailedVideoPrompt: "Prompt de video detallado",
    veoGenerating: "Generando con Veo...",
    cancel: "Cancelar",
    openGrok: "Abrir Grok Imagine",
    openKling: "Abrir Kling AI",
    close: "Cerrar",
    french: "Francés",
    english: "Inglés",
    spanish: "Español",
    arabic: "Árabe",
    japanese: "Japonés",
    chinese: "Chino",
    korean: "Coreano",
    fast: "Rápido",
    hq: "HQ",
    firstFrame: "Primer fotograma (Colorizado 16:9)",
    lastFrame: "Último fotograma (Colorizado 16:9)",
    showPrompt: "Mostrar/Editar prompt",
    edit: "Editar",
    download: "Descargar",
    regenerate: "Regenerar",
    imageNotAvailable: "Imagen no disponible",
    copyPrompt: "Copiar prompt",
    globalStyle: "Estilo global",
    pipelineTitle: "Línea de ejecución",
    contexte: "Contexto",
    errorPdf: "Por favor, sube un archivo PDF válido.",
    errorBible: "Error al extraer la Biblia de personajes.",
    errorApiKey: "Se requiere una clave API para la generación de videos.",
    errorCanvas: "No se pudo crear el contexto del lienzo.",
    errorCrop: "Error al cargar la imagen para el recorte.",
    errorCropProcess: "Error durante el recorte.",
    errorFirstFrame: "Error en el primer fotograma",
    errorLastFrame: "Error en el último fotograma",
    errorProcessing: "Ocurrió un error durante el procesamiento.",
    errorEditFrame: "Error al editar el fotograma",
    errorVideo: "Error de video",
    characters: "Personajes",
    dialogueSpoken: "Diálogo hablado",
    isSpeaking: "está hablando",
    mangaName: "Nombre del Manga",
    chapter: "Capítulo",
    searchBible: "Buscar en Internet",
    searching: "Buscando...",
    or: "O"
  },
  ar: {
    title: "Manga-to-Anime Studio",
    subtitle: "سير عمل مؤتمت: استخراج، تلوين 16:9 وتحريك.",
    errorTitle: "خطأ في سير العمل",
    settings: "الإعدادات",
    uiLanguage: "لغة الواجهة",
    targetLanguage: "اللغة المستهدفة (الترجمة)",
    analysisModel: "نموذج التحليل",
    bibleModel: "نموذج الكتاب المرجعي",
    imageModel: "نموذج الصور",
    videoModel: "نموذج الفيديو",
    bibleSection: "1. الكتاب المرجعي للشخصيات (اختياري)",
    uploadPdf: "قم بتحميل ملف PDF (مثلاً: المجلد 1) لاستخراج أوصاف الشخصيات.",
    extractBible: "استخراج الكتاب المرجعي",
    extracting: "جاري الاستخراج...",
    bibleExtracted: "تم استخراج الكتاب المرجعي",
    pageSection: "2. الصفحة المراد تلوينها",
    uploadImage: "انقر لتحميل صورة",
    supportedFormats: "التنسيقات المدعومة: JPG, PNG",
    change: "تغيير",
    process: "استخراج وتلوين",
    processWithContext: "استخراج وتلوين (مع السياق)",
    processing: "جاري المعالجة...",
    pipeline: "خط التنفيذ",
    generateAllVideos: "إنشاء جميع الفيديوهات",
    exportProject: "تصدير المشروع",
    uploadPrompt: "قم بتحميل صفحة وابدأ سير العمل لرؤية التحليل واللوحات المستخرجة.",
    globalScript: "السيناريو العالمي والتحليل",
    extractedPanels: "اللوحات المستخرجة",
    panel: "لوحة",
    generateVideo: "إنشاء فيديو",
    videoGenerated: "تم إنشاء الفيديو",
    generating: "جاري الإنشاء...",
    pause: "إيقاف مؤقت",
    resume: "استئناف",
    step1Title: "التحليل والاستخراج",
    step1Desc: "السيناريو العالمي والقص",
    step2Title: "التلوين و 16:9",
    step2Desc: "إنشاء الإطارات الأولى والأخيرة",
    step3Title: "إنشاء الفيديو",
    step3Desc: "تحريك Veo (اختياري)",
    expandPanel: "توسيع اللوحة",
    collapsePanel: "طي اللوحة",
    manualGrok: "يدوياً باستخدام Grok",
    manualKling: "يدوياً باستخدام Kling AI",
    autoVeo: "تلقائياً باستخدام VEO",
    manualInstructions: "سجل الدخول إلى حسابك، وأنشئ فيديو بنسبة 16:9، ثم انسخ الصور ومطالبة المشهد.",
    colors: "الألوان",
    pageContext: "سياق الصفحة",
    animeScript: "سيناريو الأنمي",
    originalPanel: "اللوحة الأصلية المستخرجة",
    copied: "تم النسخ!",
    copyImage: "نسخ الصورة",
    editPromptPlaceholder: "تعديل المطالبة...",
    confirm: "تأكيد",
    generationPrompt: "مطالبة الإنشاء:",
    detailedVideoPrompt: "مطالبة فيديو مفصلة",
    veoGenerating: "جاري الإنشاء بواسطة Veo...",
    cancel: "إلغاء",
    openGrok: "فتح Grok Imagine",
    openKling: "فتح Kling AI",
    close: "إغلاق",
    french: "الفرنسية",
    english: "الإنجليزية",
    spanish: "الإسبانية",
    arabic: "العربية",
    japanese: "اليابانية",
    chinese: "الصينية",
    korean: "الكورية",
    fast: "سريع",
    hq: "جودة عالية",
    firstFrame: "الإطار الأول (ملون 16:9)",
    lastFrame: "الإطار الأخير (ملون 16:9)",
    showPrompt: "عرض/تعديل المطالبة",
    edit: "تعديل",
    download: "تحميل",
    regenerate: "إعادة إنشاء",
    imageNotAvailable: "الصورة غير متاحة",
    copyPrompt: "نسخ المطالبة",
    globalStyle: "النمط العالمي",
    pipelineTitle: "خط التنفيذ",
    contexte: "السياق",
    errorPdf: "يرجى تحميل ملف PDF صالح.",
    errorBible: "خطأ في استخراج الكتاب المرجعي للشخصيات.",
    errorApiKey: "مفتاح API مطلوب لإنشاء الفيديو.",
    errorCanvas: "تعذر إنشاء سياق اللوحة.",
    errorCrop: "خطأ في تحميل الصورة للقص.",
    errorCropProcess: "خطأ أثناء القص.",
    errorFirstFrame: "خطأ في الإطار الأول",
    errorLastFrame: "خطأ في الإطار الأخير",
    errorProcessing: "حدث خطأ أثناء المعالجة.",
    errorEditFrame: "خطأ في تعديل الإطار",
    errorVideo: "خطأ في الفيديو",
    characters: "الشخصيات",
    dialogueSpoken: "الحوار المنطوق",
    isSpeaking: "يتحدث",
    mangaName: "اسم المانجا",
    chapter: "الفصل",
    searchBible: "بحث في الإنترنت",
    searching: "جاري البحث...",
    or: "أو"
  },
  ja: {
    title: "Manga-to-Anime Studio",
    subtitle: "自動ワークフロー：抽出、16:9着色、アニメーション。",
    errorTitle: "ワークフローエラー",
    settings: "設定",
    uiLanguage: "インターフェース言語",
    targetLanguage: "対象言語（翻訳）",
    analysisModel: "分析モデル",
    bibleModel: "バイブルモデル",
    imageModel: "画像モデル",
    videoModel: "ビデオモデル",
    bibleSection: "1. キャラクターバイブル（任意）",
    uploadPdf: "キャラクターの説明を抽出するためにPDF（例：第1巻）をアップロードしてください。",
    extractBible: "バイブルを抽出",
    extracting: "抽出中...",
    bibleExtracted: "バイブルが抽出されました",
    pageSection: "2. 着色するページ",
    uploadImage: "クリックして画像をアップロード",
    supportedFormats: "対応形式: JPG, PNG",
    change: "変更",
    process: "抽出して着色",
    processWithContext: "抽出して着色（コンテキストあり）",
    processing: "処理中...",
    pipeline: "実行パイプライン",
    generateAllVideos: "すべてのビデオを生成",
    exportProject: "プロジェクトをエクスポート",
    uploadPrompt: "ページをアップロードしてワークフローを開始し、分析と抽出されたパネルを確認してください。",
    globalScript: "グローバルスクリプトと分析",
    extractedPanels: "抽出されたパネル",
    panel: "パネル",
    generateVideo: "ビデオを生成",
    videoGenerated: "ビデオが生成されました",
    generating: "生成中...",
    pause: "一時停止",
    resume: "再開",
    step1Title: "分析と抽出",
    step1Desc: "グローバルスクリプトとクロッピング",
    step2Title: "着色と16:9",
    step2Desc: "最初と最後のフレームの生成",
    step3Title: "ビデオ生成",
    step3Desc: "Veoアニメーション（任意）",
    expandPanel: "パネルを展開",
    collapsePanel: "パネルを折りたたむ",
    manualGrok: "Grokで手動",
    manualKling: "Kling AIで手動",
    autoVeo: "VEOで自動",
    manualInstructions: "アカウントにログインし、16:9のビデオを生成してから、画像とシーンのプロンプトをコピーしてください。",
    colors: "色",
    pageContext: "ページのコンテキスト",
    animeScript: "アニメスクリプト",
    originalPanel: "抽出された元のパネル",
    copied: "コピーしました！",
    copyImage: "画像をコピー",
    editPromptPlaceholder: "プロンプトを編集...",
    confirm: "確認",
    generationPrompt: "生成プロンプト：",
    detailedVideoPrompt: "詳細なビデオプロンプト",
    veoGenerating: "Veoで生成中...",
    cancel: "キャンセル",
    openGrok: "Grok Imagineを開く",
    openKling: "Kling AIを開く",
    close: "閉じる",
    french: "フランス語",
    english: "英語",
    spanish: "スペイン語",
    arabic: "アラビア語",
    japanese: "日本語",
    chinese: "中国語",
    korean: "韓国語",
    fast: "高速",
    hq: "高品質",
    firstFrame: "最初のフレーム (16:9 着色済み)",
    lastFrame: "最後のフレーム (16:9 着色済み)",
    showPrompt: "プロンプトを表示/編集",
    edit: "編集",
    download: "ダウンロード",
    regenerate: "再生成",
    imageNotAvailable: "画像は利用できません",
    copyPrompt: "プロンプトをコピー",
    globalStyle: "グローバルスタイル",
    pipelineTitle: "実行パイプライン",
    contexte: "コンテキスト",
    errorPdf: "有効なPDFファイルをアップロードしてください。",
    errorBible: "キャラクターバイブルの抽出中にエラーが発生しました。",
    errorApiKey: "ビデオ生成にはAPIキーが必要です。",
    errorCanvas: "キャンバスコンテキストを作成できません。",
    errorCrop: "クロッピング用の画像の読み込み中にエラーが発生しました。",
    errorCropProcess: "クロッピング中にエラーが発生しました。",
    errorFirstFrame: "最初のフレームのエラー",
    errorLastFrame: "最後のフレームのエラー",
    errorProcessing: "処理中にエラーが発生しました。",
    errorEditFrame: "フレームの編集エラー",
    errorVideo: "ビデオエラー",
    characters: "キャラクター",
    dialogueSpoken: "話された台詞",
    isSpeaking: "が話しています",
    mangaName: "マンガ名",
    chapter: "チャプター",
    searchBible: "インターネットで検索",
    searching: "検索中...",
    or: "または"
  },
  zh: {
    title: "Manga-to-Anime Studio",
    subtitle: "自动化工作流：提取、16:9 上色和动画。",
    errorTitle: "工作流错误",
    settings: "设置",
    uiLanguage: "界面语言",
    targetLanguage: "目标语言（翻译）",
    analysisModel: "分析模型",
    bibleModel: "设定集模型",
    imageModel: "图像模型",
    videoModel: "视频模型",
    bibleSection: "1. 角色设定集（可选）",
    uploadPdf: "上传 PDF（例如：第 1 卷）以提取角色描述。",
    extractBible: "提取设定集",
    extracting: "正在提取...",
    bibleExtracted: "设定集已提取",
    pageSection: "2. 待上色页面",
    uploadImage: "点击上传图片",
    supportedFormats: "支持格式：JPG, PNG",
    change: "更改",
    process: "提取并上色",
    processWithContext: "提取并上色（带上下文）",
    processing: "正在处理...",
    pipeline: "执行流水线",
    generateAllVideos: "生成所有视频",
    exportProject: "导出项目",
    uploadPrompt: "上传页面并启动工作流以查看分析和提取的面板。",
    globalScript: "全局脚本与分析",
    extractedPanels: "提取的面板",
    panel: "面板",
    generateVideo: "生成视频",
    videoGenerated: "视频已生成",
    generating: "正在生成...",
    pause: "暂停",
    resume: "继续",
    step1Title: "分析与提取",
    step1Desc: "全局脚本与裁剪",
    step2Title: "上色与 16:9",
    step2Desc: "生成首尾帧",
    step3Title: "视频生成",
    step3Desc: "Veo 动画（可选）",
    expandPanel: "展开面板",
    collapsePanel: "折叠面板",
    manualGrok: "使用 Grok 手动",
    manualKling: "使用 Kling AI 手动",
    autoVeo: "使用 VEO 自动",
    manualInstructions: "登录您的帐户，生成 16:9 视频，然后复制图像和场景提示词。",
    colors: "颜色",
    pageContext: "页面上下文",
    animeScript: "动漫脚本",
    originalPanel: "提取的原始面板",
    copied: "已复制！",
    copyImage: "复制图像",
    editPromptPlaceholder: "编辑提示词...",
    confirm: "确认",
    generationPrompt: "生成提示词：",
    detailedVideoPrompt: "详细视频提示词",
    veoGenerating: "Veo 正在生成...",
    cancel: "取消",
    openGrok: "打开 Grok Imagine",
    openKling: "打开 Kling AI",
    close: "关闭",
    french: "法语",
    english: "英语",
    spanish: "西班牙语",
    arabic: "阿拉伯语",
    japanese: "日语",
    chinese: "中文",
    korean: "韩语",
    fast: "快速",
    hq: "高清",
    firstFrame: "首帧 (16:9 已上色)",
    lastFrame: "尾帧 (16:9 已上色)",
    showPrompt: "显示/编辑提示词",
    edit: "编辑",
    download: "下载",
    regenerate: "重新生成",
    imageNotAvailable: "图像不可用",
    copyPrompt: "复制提示词",
    globalStyle: "全局风格",
    pipelineTitle: "执行流水线",
    contexte: "上下文",
    errorPdf: "请上传有效的 PDF 文件。",
    errorBible: "提取角色设定集时出错。",
    errorApiKey: "视频生成需要 API 密钥。",
    errorCanvas: "无法创建画布上下文。",
    errorCrop: "加载裁剪图像时出错。",
    errorCropProcess: "裁剪过程中出错。",
    errorFirstFrame: "首帧错误",
    errorLastFrame: "尾帧错误",
    errorProcessing: "处理过程中出错。",
    errorEditFrame: "编辑帧时出错。",
    errorVideo: "视频错误",
    characters: "角色",
    dialogueSpoken: "口语对话",
    isSpeaking: "正在说话",
    mangaName: "漫画名称",
    chapter: "章节",
    searchBible: "互联网搜索",
    searching: "搜索中...",
    or: "或"
  },
  ko: {
    title: "Manga-to-Anime Studio",
    subtitle: "자동화된 워크플로우: 추출, 16:9 채색 및 애니메이션.",
    errorTitle: "워크플로우 오류",
    settings: "설정",
    uiLanguage: "인터페이스 언어",
    targetLanguage: "대상 언어 (번역)",
    analysisModel: "분석 모델",
    bibleModel: "설정집 모델",
    imageModel: "이미지 모델",
    videoModel: "비디오 모델",
    bibleSection: "1. 캐릭터 설정집 (선택 사항)",
    uploadPdf: "캐릭터 설명을 추출하려면 PDF(예: 1권)를 업로드하세요.",
    extractBible: "설정집 추출",
    extracting: "추출 중...",
    bibleExtracted: "설정집 추출 완료",
    pageSection: "2. 채색할 페이지",
    uploadImage: "클릭하여 이미지 업로드",
    supportedFormats: "지원 형식: JPG, PNG",
    change: "변경",
    process: "추출 및 채색",
    processWithContext: "추출 및 채색 (컨텍스트 포함)",
    processing: "처리 중...",
    pipeline: "실행 파이프라인",
    generateAllVideos: "모든 비디오 생성",
    exportProject: "프로젝트 내보내기",
    uploadPrompt: "페이지를 업로드하고 워크플로우를 시작하여 분석 및 추출된 패널을 확인하세요.",
    globalScript: "전체 스크립트 및 분석",
    extractedPanels: "추출된 패널",
    panel: "패널",
    generateVideo: "비디오 생성",
    videoGenerated: "비디오 생성됨",
    generating: "생성 중...",
    pause: "일시 중지",
    resume: "재개",
    step1Title: "분석 및 추출",
    step1Desc: "전체 스크립트 및 크롭",
    step2Title: "채색 및 16:9",
    step2Desc: "시작/종료 프레임 생성",
    step3Title: "비디오 생성",
    step3Desc: "Veo 애니메이션 (선택 사항)",
    expandPanel: "패널 확장",
    collapsePanel: "패널 축소",
    manualGrok: "Grok으로 수동",
    manualKling: "Kling AI로 수동",
    autoVeo: "VEO로 자동",
    manualInstructions: "계정에 로그인하고 16:9 비디오를 생성한 다음 이미지와 장면 프롬프트를 복사하세요.",
    colors: "색상",
    pageContext: "페이지 컨텍스트",
    animeScript: "애니메이션 스크립트",
    originalPanel: "추출된 원본 패널",
    copied: "복사됨!",
    copyImage: "이미지 복사",
    editPromptPlaceholder: "프롬프트 편집...",
    confirm: "확인",
    generationPrompt: "생성 프롬프트:",
    detailedVideoPrompt: "상세 비디오 프롬프트",
    veoGenerating: "Veo 생성 중...",
    cancel: "취소",
    openGrok: "Grok Imagine 열기",
    openKling: "Kling AI 열기",
    close: "닫기",
    french: "프랑스어",
    english: "영어",
    spanish: "스페인어",
    arabic: "아랍어",
    japanese: "일본어",
    chinese: "중국어",
    korean: "한국어",
    fast: "빠름",
    hq: "고화질",
    firstFrame: "첫 번째 프레임 (16:9 채색됨)",
    lastFrame: "마지막 프레임 (16:9 채색됨)",
    showPrompt: "프롬프트 표시/편집",
    edit: "편집",
    download: "다운로드",
    regenerate: "재생성",
    imageNotAvailable: "이미지를 사용할 수 없음",
    copyPrompt: "프롬프트 복사",
    globalStyle: "글로벌 스타일",
    pipelineTitle: "실행 파이프라인",
    contexte: "컨텍스트",
    errorPdf: "유효한 PDF 파일을 업로드하세요.",
    errorBible: "캐릭터 설정집 추출 중 오류가 발생했습니다.",
    errorApiKey: "비디오 생성을 위해 API 키가 필요합니다.",
    errorCanvas: "캔버스 컨텍스트를 생성할 수 없습니다.",
    errorCrop: "크롭을 위한 이미지 로드 중 오류가 발생했습니다.",
    errorCropProcess: "크롭 중 오류가 발생했습니다.",
    errorFirstFrame: "첫 번째 프레임 오류",
    errorLastFrame: "마지막 프레임 오류",
    errorProcessing: "처리 중 오류가 발생했습니다.",
    errorEditFrame: "프레임 편집 중 오류가 발생했습니다.",
    errorVideo: "비디오 오류",
    characters: "캐릭터",
    dialogueSpoken: "말한 대화",
    isSpeaking: "이(가) 말하고 있습니다",
    mangaName: "만화 이름",
    chapter: "챕터",
    searchBible: "인터넷 검색",
    searching: "검색 중...",
    or: "또는"
  }
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [mangaName, setMangaName] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isExtractingBible, setIsExtractingBible] = useState(false);
  const [isSearchingBible, setIsSearchingBible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [characterBible, setCharacterBible] = useState<any | null>(null);
  const [pageAnalysis, setPageAnalysis] = useState<string | null>(null);
  const [globalScript, setGlobalScript] = useState<string | null>(null);
  const [panels, setPanels] = useState<PanelData[]>([]);

  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
  const [sourceImageMimeType, setSourceImageMimeType] = useState<string | null>(null);
  
  const [imageModel, setImageModel] = useState<string>('gemini-2.5-flash-image');
  const [analysisModel, setAnalysisModel] = useState<string>('gemini-3.1-pro-preview');
  const [bibleModel, setBibleModel] = useState<string>('gemini-2.5-flash');
  const [videoModel, setVideoModel] = useState<string>('veo-3.1-fast-generate-preview');
  const [language, setLanguage] = useState<string>('français');
  const [uiLanguage, setUiLanguage] = useState<'fr' | 'en' | 'es' | 'ar' | 'ja' | 'zh' | 'ko'>('fr');

  const t = translations[uiLanguage];

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialPosition, setTutorialPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const tutorialSteps = [
    { id: 'tut-welcome', title: t.tutStep1Title, desc: t.tutStep1Desc },
    { id: 'tut-settings', title: t.tutStep2Title, desc: t.tutStep2Desc },
    { id: 'tut-bible', title: t.tutStep3Title, desc: t.tutStep3Desc },
    { id: 'tut-upload', title: t.tutStep4Title, desc: t.tutStep4Desc },
    { id: 'tut-process', title: t.tutStep5Title, desc: t.tutStep5Desc },
    { id: 'tut-results', title: t.tutStep6Title, desc: t.tutStep6Desc },
  ];

  useEffect(() => {
    const updatePosition = () => {
      if (showTutorial) {
        const element = document.getElementById(tutorialSteps[tutorialStep].id);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTutorialPosition({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }
      }
    };

    if (showTutorial) {
      updatePosition();
      const element = document.getElementById(tutorialSteps[tutorialStep].id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition);
      
      const timer = setTimeout(updatePosition, 100);
      const timer2 = setTimeout(updatePosition, 500);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [showTutorial, tutorialStep, uiLanguage]);

  const handleNextTutorial = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const startTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };

  useEffect(() => {
    setSteps(prev => prev.map(step => {
      if (step.id === 1) return { ...step, title: t.step1Title, description: t.step1Desc };
      if (step.id === 2) return { ...step, title: t.step2Title, description: t.step2Desc };
      if (step.id === 3) return { ...step, title: t.step3Title, description: t.step3Desc };
      return step;
    }));
  }, [uiLanguage, t.step1Title, t.step1Desc, t.step2Title, t.step2Desc, t.step3Title, t.step3Desc]);

  const [videoBatchStatus, setVideoBatchStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const videoBatchStatusRef = useRef<'idle' | 'running' | 'paused'>('idle');

  const [imageBatchStatus, setImageBatchStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const imageBatchStatusRef = useRef<'idle' | 'running' | 'paused'>('idle');

  const [isBibleCollapsed, setIsBibleCollapsed] = useState(false);
  const [isAnalysisCollapsed, setIsAnalysisCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [continueStory, setContinueStory] = useState(false);
  const [previousScript, setPreviousScript] = useState<string | undefined>(undefined);
  const [showScrollNav, setShowScrollNav] = useState(false);

  const panelsRef = useRef<PanelData[]>([]);
  useEffect(() => {
    panelsRef.current = panels;
  }, [panels]);

  const setBatchStatus = (status: 'idle' | 'running' | 'paused') => {
    setVideoBatchStatus(status);
    videoBatchStatusRef.current = status;
  };

  const setImageStatus = (status: 'idle' | 'running' | 'paused') => {
    setImageBatchStatus(status);
    imageBatchStatusRef.current = status;
  };

  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: 1, title: 'Analyse & Extraction', description: 'Script global & Découpage', status: 'idle' },
    { id: 2, title: 'Colorisation & 16:9', description: 'Génération First/Last Frames', status: 'idle' },
    { id: 3, title: 'Génération Vidéo', description: 'Animation Veo (Optionnel)', status: 'idle' },
  ]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);

  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviousScript(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const playSound = (type: 'done' | 'error' | 'success') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'done') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const updateStep = (id: number, status: StepStatus) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    if (status === 'done') playSound('done');
    if (status === 'error') playSound('error');
  };

  const updatePanel = (id: string, updates: Partial<PanelData>) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const processImageFile = (selectedFile: File) => {
    setFile(selectedFile);
    setPageAnalysis(null);
    setGlobalScript(null);
    setPanels([]);
    setError(null);
    setSteps(steps.map(s => ({ ...s, status: 'idle' })));

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processImageFile(selectedFile);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type.startsWith('image/')) {
        processImageFile(selectedFile);
      } else {
        setError("Veuillez uploader une image valide (JPG, PNG).");
      }
    }
  };

  const processPdfFile = (selectedFile: File) => {
    setPdfFile(selectedFile);
    setCharacterBible(null);
    setError(null);
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processPdfFile(selectedFile);
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type === 'application/pdf') {
        processPdfFile(selectedFile);
      } else {
        setError(t.errorPdf);
      }
    }
  };

  const handleExtractBible = async () => {
    if (!pdfFile) return;
    setIsExtractingBible(true);
    setError(null);
    try {
      const base64Pdf = await fileToBase64(pdfFile);
      const bible = await extractCharacterBible(base64Pdf, pdfFile.type);
      setCharacterBible(bible);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.errorBible);
    } finally {
      setIsExtractingBible(false);
    }
  };

  const handleSearchBible = async () => {
    if (!mangaName.trim()) return;
    setIsSearchingBible(true);
    setError(null);
    try {
      const bible = await searchCharacterBible(mangaName, chapterNumber);
      setCharacterBible(bible);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.errorBible);
    } finally {
      setIsSearchingBible(false);
    }
  };

  const copyTextToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const copyImageToClipboard = async (dataUrl: string, id: string) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy image: ", err);
      alert("Erreur lors de la copie de l'image. Votre navigateur ne supporte peut-être pas cette fonctionnalité.");
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Add global analysis and script
      if (pageAnalysis || globalScript) {
        let content = '';
        if (pageAnalysis) content += `=== ANALYSE GLOBALE ===\n${pageAnalysis}\n\n`;
        if (globalScript) content += `=== SCRIPT GLOBAL ===\n${globalScript}\n`;
        zip.file("analyse_et_script.txt", content);
      }

      // Add panels
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const folderName = `scene_${i + 1}`;
        const folder = zip.folder(folderName);
        if (!folder) continue;

        // Add prompts
        const detailedVideoPrompt = panel.speaker && panel.speaker !== 'Narrator' && panel.speaker !== 'Action' 
          ? `${panel.speaker} is speaking: "${panel.dialogue}". ${panel.videoPrompt}`
          : `Dialogue spoken: "${panel.dialogue}". ${panel.videoPrompt}`;
          
        const promptsContent = `Dialogue: ${panel.dialogue}\n\nSpeaker: ${panel.speaker}\n\nFirst Frame Prompt:\n${panel.firstFramePrompt}\n\nLast Frame Prompt:\n${panel.lastFramePrompt}\n\nVideo Prompt:\n${detailedVideoPrompt}`;
        folder.file("prompts.txt", promptsContent);

        // Add images
        const addImageToZip = (url: string | undefined, filename: string) => {
          if (url) {
            const matches = url.match(/^data:(.+);base64,(.+)$/);
            if (matches && matches[2]) {
              folder.file(filename, matches[2], { base64: true });
            }
          }
        };

        addImageToZip(panel.firstFrameUrl, "first_frame.png");
        addImageToZip(panel.lastFrameUrl, "last_frame.png");

        // Add video
        if (panel.videoUrl) {
          try {
            const response = await fetch(panel.videoUrl);
            const blob = await response.blob();
            folder.file("video.mp4", blob);
          } catch (e) {
            console.error(`Erreur lors du téléchargement de la vidéo pour le panneau ${i + 1}`, e);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const zipName = file ? `${file.name.replace(/\.[^/.]+$/, "")}_export.zip` : "manga_to_anime_export.zip";
      saveAs(content, zipName);
    } catch (err) {
      console.error("Erreur lors de la création du ZIP", err);
      setError("Erreur lors de la création du fichier ZIP.");
    } finally {
      setIsZipping(false);
    }
  };

  const getFilename = (index: number, dialogue: string, type: 'first' | 'last') => {
    const safeName = dialogue.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `scene_${index + 1}_${safeName}_${type}.png`;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const regenerateFrame = async (panelId: string, type: 'first' | 'last') => {
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    const isFirst = type === 'first';
    updatePanel(panelId, { 
      [isFirst ? 'isGeneratingFirst' : 'isGeneratingLast']: true,
      error: undefined 
    });

    try {
      const prompt = isFirst ? panel.firstFramePrompt : panel.lastFramePrompt;
      
      let refBase64 = sourceImageBase64 || undefined;
      let refMime = sourceImageMimeType || undefined;
      let isRefGenerated = false;

      if (!isFirst && panel.firstFrameUrl) {
        const matches = panel.firstFrameUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          refMime = matches[1];
          refBase64 = matches[2];
          isRefGenerated = true;
        }
      }

      const imageUrl = await generateAnimeFrame(prompt, refBase64, refMime, imageModel, isRefGenerated);
      updatePanel(panelId, { 
        [isFirst ? 'firstFrameUrl' : 'lastFrameUrl']: imageUrl,
        [isFirst ? 'isGeneratingFirst' : 'isGeneratingLast']: false 
      });
    } catch (err: any) {
      console.error(err);
      updatePanel(panelId, { 
        error: `Erreur génération frame: ${err.message}`,
        [isFirst ? 'isGeneratingFirst' : 'isGeneratingLast']: false 
      });
    }
  };

  const submitEditFrame = async (panelId: string, type: 'first' | 'last') => {
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    const isFirst = type === 'first';
    const currentUrl = isFirst ? panel.firstFrameUrl : panel.lastFrameUrl;
    const editPrompt = isFirst ? panel.editPromptFirst : panel.editPromptLast;

    if (!currentUrl || !editPrompt) return;

    updatePanel(panelId, { 
      [isFirst ? 'isGeneratingFirst' : 'isGeneratingLast']: true,
      [isFirst ? 'isEditingFirst' : 'isEditingLast']: false,
      error: undefined 
    });

    try {
      const imageUrl = await editAnimeFrame(currentUrl, editPrompt, imageModel);
      updatePanel(panelId, { 
        [isFirst ? 'firstFrameUrl' : 'lastFrameUrl']: imageUrl,
        [isFirst ? 'isGeneratingFirst' : 'isGeneratingLast']: false,
        [isFirst ? 'editPromptFirst' : 'editPromptLast']: ''
      });
    } catch (err: any) {
      console.error(err);
      updatePanel(panelId, { 
        error: `${t.errorEditFrame}: ${err.message}`,
        [isFirst ? 'isGeneratingFirst' : 'isGeneratingLast']: false 
      });
    }
  };

  const generatePanelVideo = async (panelId: string) => {
    const panel = panelsRef.current.find(p => p.id === panelId);
    if (!panel || !panel.firstFrameUrl) return;

    // Check for Veo API key
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await window.aistudio.openSelectKey();
        } catch (e) {
          updatePanel(panelId, { error: t.errorApiKey });
          return;
        }
      }
    }

    updatePanel(panelId, { isGeneratingVideo: true, error: undefined });
    updateStep(3, 'running');

    try {
      const fullVideoPrompt = panel.speaker && panel.speaker !== 'Narrator' && panel.speaker !== 'Action' 
        ? `${panel.speaker} ${t.isSpeaking}: "${panel.dialogue}". ${panel.videoPrompt}`
        : `${t.dialogueSpoken}: "${panel.dialogue}". ${panel.videoPrompt}`;
      const videoUrl = await generateVideo(panel.firstFrameUrl, panel.lastFrameUrl || null, fullVideoPrompt);
      updatePanel(panelId, { videoUrl, isGeneratingVideo: false });
      updateStep(3, 'done');
    } catch (err: any) {
      console.error(err);
      updatePanel(panelId, { error: `${t.errorVideo}: ${err.message}`, isGeneratingVideo: false });
      updateStep(3, 'error');
    }
  };

  const generateAllVideos = async () => {
    if (videoBatchStatusRef.current === 'running') return;
    
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await window.aistudio.openSelectKey();
        } catch (e) {
          setError(t.errorApiKey);
          return;
        }
      }
    }

    setBatchStatus('running');

    for (let i = 0; i < panelsRef.current.length; i++) {
      while (videoBatchStatusRef.current === 'paused') {
        await new Promise(r => setTimeout(r, 1000));
      }
      if (videoBatchStatusRef.current === 'idle') {
        break;
      }

      const panel = panelsRef.current[i];
      if (!panel.videoUrl && !panel.isGeneratingVideo && panel.firstFrameUrl && !panel.error) {
        await generatePanelVideo(panel.id);
      }
    }
    
    if (videoBatchStatusRef.current === 'running') {
      setBatchStatus('idle');
    }
  };

  const cropImage = async (base64Image: string, boundingBox: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error(t.errorCanvas));
          return;
        }

        // Convert proportional coordinates (0-1000) to actual pixels
        const x = (boundingBox.xmin / 1000) * img.width;
        const y = (boundingBox.ymin / 1000) * img.height;
        const width = ((boundingBox.xmax - boundingBox.xmin) / 1000) * img.width;
        const height = ((boundingBox.ymax - boundingBox.ymin) / 1000) * img.height;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error(t.errorCrop));
      img.src = base64Image;
    });
  };

  const startWorkflow = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setPageAnalysis(null);
    setGlobalScript(null);
    setPanels([]);

    try {
      const base64Image = await fileToBase64(file);
      const mimeType = file.type;
      
      setSourceImageBase64(base64Image);
      setSourceImageMimeType(mimeType);

      // STEP 1: Analyze & Extract Panels
      updateStep(1, 'running');
      const extractedData = await analyzeMangaPage(
        base64Image, 
        mimeType, 
        characterBible, 
        analysisModel, 
        language,
        continueStory ? previousScript : undefined
      );
      
      setPageAnalysis(extractedData.pageAnalysis);
      setGlobalScript(extractedData.globalScript);
      setPreviousScript(extractedData.globalScript); // Store for next time
      setShowScrollNav(true); // Show navigation once we have results

      const initializedPanels: PanelData[] = await Promise.all(extractedData.panels.map(async (p: any, index: number) => {
        let croppedImageUrl;
        if (p.boundingBox) {
          try {
            croppedImageUrl = await cropImage(base64Image, p.boundingBox);
          } catch (e) {
            console.error(t.errorCropProcess, e);
          }
        }

        return {
          id: `panel-${index}-${Date.now()}`,
          speaker: p.speaker,
          dialogue: p.dialogue,
          boundingBox: p.boundingBox,
          croppedImageUrl,
          firstFramePrompt: p.firstFramePrompt,
          lastFramePrompt: p.lastFramePrompt,
          videoPrompt: p.videoPrompt,
          isGeneratingFirst: true,
          isGeneratingLast: true,
        };
      }));
      
      setPanels(initializedPanels);
      updateStep(1, 'done');

      // STEP 2: Generate Frames sequentially to avoid rate limits
      updateStep(2, 'running');
      setImageStatus('running');
      
      for (const panel of initializedPanels) {
        while (imageBatchStatusRef.current === 'paused') {
          await new Promise(r => setTimeout(r, 1000));
        }

        // Generate First Frame
        let firstUrl = '';
        try {
          const refImage = panel.croppedImageUrl || base64Image;
          const refMime = panel.croppedImageUrl ? 'image/jpeg' : mimeType;
          firstUrl = await generateAnimeFrame(panel.firstFramePrompt, refImage, refMime, imageModel, false);
          updatePanel(panel.id, { firstFrameUrl: firstUrl, isGeneratingFirst: false });
        } catch (e) {
          updatePanel(panel.id, { isGeneratingFirst: false, error: t.errorFirstFrame });
        }

        while (imageBatchStatusRef.current === 'paused') {
          await new Promise(r => setTimeout(r, 1000));
        }

        // Generate Last Frame
        try {
          let refBase64 = panel.croppedImageUrl || base64Image;
          let refMime = panel.croppedImageUrl ? 'image/jpeg' : mimeType;
          let isRefGenerated = false;
          
          if (firstUrl) {
            const matches = firstUrl.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              refMime = matches[1];
              refBase64 = matches[2];
              isRefGenerated = true;
            }
          }

          const lastUrl = await generateAnimeFrame(panel.lastFramePrompt, refBase64, refMime, imageModel, isRefGenerated);
          updatePanel(panel.id, { lastFrameUrl: lastUrl, isGeneratingLast: false });
        } catch (e) {
          updatePanel(panel.id, { isGeneratingLast: false, error: t.errorLastFrame });
        }
      }
      
      setImageStatus('idle');
      updateStep(2, 'done');

    } catch (err: any) {
      console.error(err);
      setError(err.message || t.errorProcessing);
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetWorkflow = () => {
    // Carry over current script to previous script for continuity
    if (globalScript) {
      setPreviousScript(globalScript);
      setContinueStory(true);
    }
    
    setPanels([]);
    setPageAnalysis(null);
    setGlobalScript(null);
    setSteps(prev => prev.map(s => ({ ...s, status: 'idle' })));
    setShowScrollNav(false);
    setError(null);
    // We keep characterBible as requested
    setFile(null);
    setPreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    
    // Scroll back to top to start fresh
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between" id="tut-welcome">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 neon-text italic">
            <Wand2 className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" size={32} />
            {t.title}
          </h1>
          <p className="text-cyan-400/60 mt-1 font-mono text-xs uppercase tracking-widest">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={startTutorial}
            className="neon-button px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <HelpCircle size={18} />
            {t.tutorial}
          </button>
          <div className="text-[10px] font-mono text-cyan-400/50 bg-slate-900/80 px-3 py-1 rounded-full border border-cyan-500/30 backdrop-blur-md">
            SYSTEM_v2.1.0_STABLE
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-200">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold">{t.errorTitle}</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 flex-1">
        {/* Main App Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full">
          
          {/* LEFT COLUMN: Input & Progress */}
        <div className={`transition-all duration-300 flex flex-col gap-6 ${isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-4'}`}>
          <div className="flex justify-end mb-[-1rem] z-10">
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="bg-gray-900 border border-gray-800 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title={isSidebarCollapsed ? t.expandPanel : t.collapsePanel}>
              {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>

          {/* Settings Section */}
          <div id="tut-settings" className={`glass-panel border-cyan-500/30 ${isSidebarCollapsed ? 'p-4 flex justify-center cursor-pointer hover:bg-cyan-500/10' : 'p-6'}`} onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}>
            {isSidebarCollapsed ? (
              <Settings size={24} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" title={t.settings} />
            ) : (
              <>
                <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}>
                  <h2 className="text-lg font-black flex items-center gap-2 neon-text italic">
                    <Settings size={18} className="text-cyan-400" /> {t.settings}
                  </h2>
                  {isSettingsCollapsed ? <ChevronDown size={18} className="text-cyan-400/50" /> : <ChevronUp size={18} className="text-cyan-400/50" />}
                </div>
                {!isSettingsCollapsed && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400/60 mb-1 flex items-center gap-1"><Globe size={10}/> {t.uiLanguage}</label>
                        <select value={uiLanguage} onChange={e => setUiLanguage(e.target.value as any)} className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-400 transition-colors">
                          <option value="fr">{t.french}</option>
                          <option value="en">{t.english}</option>
                          <option value="es">{t.spanish}</option>
                          <option value="ar">{t.arabic}</option>
                          <option value="ja">{t.japanese}</option>
                          <option value="zh">{t.chinese}</option>
                          <option value="ko">{t.korean}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400/60 mb-1 flex items-center gap-1"><Globe size={10}/> {t.targetLanguage}</label>
                        <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-400 transition-colors">
                          <option value="français">{t.french}</option>
                          <option value="anglais">{t.english}</option>
                          <option value="espagnol">{t.spanish}</option>
                          <option value="arabe">{t.arabic}</option>
                          <option value="japonais">{t.japanese}</option>
                          <option value="chinois">{t.chinese}</option>
                          <option value="coréen">{t.korean}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400/60 mb-1">{t.analysisModel}</label>
                        <select value={analysisModel} onChange={e => setAnalysisModel(e.target.value)} className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg px-2 py-2 text-[10px] text-cyan-100 focus:outline-none focus:border-cyan-400 transition-colors">
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                          <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-flash-8b">Gemini 2.5 Flash-8B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400/60 mb-1">{t.bibleModel}</label>
                        <select value={bibleModel} onChange={e => setBibleModel(e.target.value)} className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg px-2 py-2 text-[10px] text-cyan-100 focus:outline-none focus:border-cyan-400 transition-colors">
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                          <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-flash-8b">Gemini 2.5 Flash-8B</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400/60 mb-1">{t.imageModel}</label>
                        <select value={imageModel} onChange={e => setImageModel(e.target.value)} className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg px-2 py-2 text-[10px] text-cyan-100 focus:outline-none focus:border-cyan-400 transition-colors">
                          <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image ({t.hq})</option>
                          <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image ({t.fast})</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400/60 mb-1">{t.videoModel}</label>
                        <select value={videoModel} onChange={e => setVideoModel(e.target.value)} className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg px-2 py-2 text-[10px] text-cyan-100 focus:outline-none focus:border-cyan-400 transition-colors">
                          <option value="veo-3.1-fast-generate-preview">Veo 3.1 Fast ({t.fast})</option>
                          <option value="veo-3.1-generate-preview">Veo 3.1 ({t.hq})</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Context Section */}
          <div id="tut-bible" className={`glass-panel border-emerald-500/30 ${isSidebarCollapsed ? 'p-4 flex justify-center cursor-pointer hover:bg-emerald-500/10' : 'p-6'}`} onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}>
            {isSidebarCollapsed ? (
              <FileText size={24} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" title={t.contexte} />
            ) : (
              <>
                <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => setIsContextCollapsed(!isContextCollapsed)}>
                  <h2 className="text-lg font-black flex items-center gap-2 neon-text italic">
                    <FileText size={18} className="text-emerald-400" /> {t.bibleSection}
                  </h2>
                  {isContextCollapsed ? <ChevronDown size={18} className="text-emerald-400/50" /> : <ChevronUp size={18} className="text-emerald-400/50" />}
                </div>
                {!isContextCollapsed && (
                  <div className="space-y-4">
                    <p className="text-xs font-mono text-emerald-400/60 mb-4 leading-relaxed">
                      {t.uploadPdf}
                    </p>
                    
                    {characterBible ? (
                      <div className="space-y-4">
                        {pdfFile && (
                          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-lg border border-emerald-500/30 backdrop-blur-md">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <File className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" size={20} />
                              <span className="text-xs font-bold text-emerald-100 truncate">{pdfFile.name}</span>
                            </div>
                            <button 
                              onClick={() => { setPdfFile(null); setCharacterBible(null); setMangaName(''); setChapterNumber(''); }}
                              className="text-emerald-400/50 hover:text-red-400 p-1 transition-colors"
                              disabled={isProcessing}
                            >
                              <Archive size={16} />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2 justify-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                            <CheckCircle size={14} /> {t.bibleExtracted}
                          </div>
                          {!pdfFile && (
                            <button 
                              onClick={() => { setPdfFile(null); setCharacterBible(null); setMangaName(''); setChapterNumber(''); }}
                              className="bg-slate-950/80 hover:bg-red-500/20 text-emerald-400/50 hover:text-red-400 p-2 rounded-lg border border-emerald-500/30 transition-all"
                              title={t.change}
                              disabled={isProcessing}
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {pdfFile ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-lg border border-emerald-500/30">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <File className="text-emerald-400" size={20} />
                                <span className="text-xs font-bold text-emerald-100 truncate">{pdfFile.name}</span>
                              </div>
                              <button 
                                onClick={() => { setPdfFile(null); setCharacterBible(null); setMangaName(''); setChapterNumber(''); }}
                                className="text-emerald-400/50 hover:text-red-400 p-1 transition-colors"
                                disabled={isExtractingBible || isProcessing}
                              >
                                <Archive size={16} />
                              </button>
                            </div>
                            <button
                              onClick={handleExtractBible}
                              disabled={isExtractingBible || isProcessing}
                              className="w-full py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all border border-emerald-500/30"
                            >
                              {isExtractingBible ? (
                                <><Loader2 size={14} className="animate-spin" /> {t.extracting}</>
                              ) : (
                                <><Users size={14} /> {t.extractBible}</>
                              )}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div 
                              onClick={() => pdfInputRef.current?.click()}
                              onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                              onDragLeave={(e) => { e.preventDefault(); setIsDraggingPdf(false); }}
                              onDrop={handlePdfDrop}
                              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                isDraggingPdf 
                                  ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                  : 'border-emerald-500/30 hover:border-emerald-400/50 bg-slate-950/50'
                              }`}
                            >
                              <File className={`mx-auto mb-2 ${isDraggingPdf ? 'text-emerald-400' : 'text-emerald-400/40'}`} size={24} />
                              <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-100">
                                {isDraggingPdf ? t.uploadImage : t.uploadImage}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 my-2">
                              <div className="h-[1px] flex-1 bg-emerald-500/20"></div>
                              <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-[0.3em]">{t.or}</span>
                              <div className="h-[1px] flex-1 bg-emerald-500/20"></div>
                            </div>

                            <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest ml-1">{t.mangaName}</label>
                                <input 
                                  type="text"
                                  value={mangaName}
                                  onChange={(e) => setMangaName(e.target.value)}
                                  placeholder="ex: One Piece"
                                  className="w-full bg-black/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-100 focus:outline-none focus:border-emerald-400/50 transition-colors"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest ml-1">{t.chapter}</label>
                                <input 
                                  type="text"
                                  value={chapterNumber}
                                  onChange={(e) => setChapterNumber(e.target.value)}
                                  placeholder="ex: 1000"
                                  className="w-full bg-black/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-100 focus:outline-none focus:border-emerald-400/50 transition-colors"
                                />
                              </div>
                              <button
                                onClick={handleSearchBible}
                                disabled={isSearchingBible || !mangaName.trim() || isProcessing}
                                className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                                  isSearchingBible || !mangaName.trim() || isProcessing
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {isSearchingBible ? (
                                  <><Loader2 size={16} className="animate-spin" /> {t.searching}</>
                                ) : (
                                  <><Search size={16} /> {t.searchBible}</>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              ref={pdfInputRef}
              onChange={handlePdfChange}
            />
          </div>

          {/* Upload Section */}
          <div id="tut-upload" className={`glass-panel border-cyan-500/30 ${isSidebarCollapsed ? 'p-4 flex justify-center cursor-pointer hover:bg-cyan-500/10' : 'p-6'}`} onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}>
            {isSidebarCollapsed ? (
              <Upload size={24} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" title={t.uploadImage} />
            ) : (
              <>
                <h2 className="text-lg font-black mb-4 flex items-center gap-2 neon-text italic">
                  <Upload size={18} className="text-cyan-400" /> {t.pageSection}
                </h2>
                
                {!previewUrl ? (
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingImage(false); }}
                    onDrop={handleImageDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDraggingImage 
                        ? 'border-cyan-500 bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                        : 'border-cyan-500/30 hover:border-cyan-400/50 bg-slate-950/50'
                    }`}
                  >
                    <ImageIcon className={`mx-auto mb-3 ${isDraggingImage ? 'text-cyan-400' : 'text-cyan-400/40'}`} size={32} />
                    <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-100">
                      {isDraggingImage ? t.uploadImage : t.uploadImage}
                    </p>
                    <p className="text-[8px] font-mono text-cyan-400/40 mt-1 uppercase tracking-tighter">{t.supportedFormats}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-black group">
                      <img src={previewUrl} alt="Preview" className="w-full h-auto object-contain max-h-[300px] opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/30"></div>
                      <button 
                        onClick={() => { setFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 bg-slate-950/80 hover:bg-red-500/80 text-cyan-400 hover:text-white text-[8px] font-mono uppercase tracking-widest px-2 py-1 rounded border border-cyan-500/30 backdrop-blur-sm transition-all"
                        disabled={isProcessing}
                      >
                        {t.change}
                      </button>
                    </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/50 border border-cyan-500/20 rounded-lg">
                          <input 
                            type="checkbox" 
                            id="continue-story" 
                            checked={continueStory} 
                            onChange={(e) => setContinueStory(e.target.checked)}
                            className="w-4 h-4 rounded border-cyan-500/30 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50"
                          />
                          <label htmlFor="continue-story" className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 cursor-pointer select-none">
                            {t.continueStory}
                          </label>
                        </div>

                        {continueStory && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/60 ml-1">
                                {t.manualScript}
                              </label>
                              <button 
                                onClick={() => scriptInputRef.current?.click()}
                                className="text-[9px] font-mono uppercase tracking-tighter text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 transition-all"
                              >
                                <Upload size={10} /> {t.uploadScript}
                              </button>
                            </div>
                            <textarea
                              value={previousScript || ''}
                              onChange={(e) => setPreviousScript(e.target.value)}
                              placeholder={t.manualScriptPlaceholder}
                              className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg p-3 text-xs text-cyan-100 focus:outline-none focus:border-cyan-400/50 min-h-[100px] font-mono"
                            />
                            <input 
                              type="file" 
                              accept=".txt" 
                              className="hidden" 
                              ref={scriptInputRef}
                              onChange={handleScriptUpload}
                            />
                          </div>
                        )}

                        <button
                        id="tut-process"
                        onClick={startWorkflow}
                        disabled={!file || isProcessing || isExtractingBible}
                        className="neon-button w-full py-4 rounded-xl flex items-center justify-center gap-3"
                      >
                        {isProcessing ? (
                          <><Loader2 size={20} className="animate-spin" /> {t.processing}</>
                        ) : (
                          <><Play size={20} /> {characterBible ? t.processWithContext : t.process}</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={imageInputRef}
                  onChange={handleImageChange}
                />
              </>
            )}
          </div>

          {/* Progress Steps */}
          {!isSidebarCollapsed && (
            <div className="glass-panel p-6">
              <h2 className="text-lg font-semibold mb-6">{t.pipelineTitle}</h2>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                {steps.map((step) => (
                  <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow bg-gray-900 ${
                      step.status === 'done' ? 'border-emerald-500 text-emerald-500' :
                      step.status === 'running' ? 'border-indigo-500 text-indigo-500' :
                      step.status === 'error' ? 'border-red-500 text-red-500' :
                      'border-gray-700 text-gray-700'
                    }`}>
                      {step.status === 'done' ? <CheckCircle size={14} /> : 
                       step.status === 'running' ? <Loader2 size={14} className="animate-spin" /> : 
                       <span className="text-[10px] font-bold">{step.id}</span>}
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-gray-800 bg-gray-900/50">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold text-sm ${step.status === 'running' ? 'text-indigo-400' : 'text-gray-200'}`}>{step.title}</h3>
                        {step.id === 2 && imageBatchStatus !== 'idle' && (
                          <button
                            onClick={() => setImageStatus(imageBatchStatus === 'paused' ? 'running' : 'paused')}
                            className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-0.5 rounded border border-gray-700 flex items-center gap-1 transition-colors"
                          >
                            {imageBatchStatus === 'paused' ? <Play size={10} /> : <Pause size={10} />}
                            {imageBatchStatus === 'paused' ? t.resume : t.pause}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Results Viewer (Panels) */}
        <div id="tut-results" className={`transition-all duration-300 flex flex-col gap-6 ${isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-8'}`}>
          
          {isProcessing && (
            <div className="glass-panel p-8 scanline-effect relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center border-2 border-cyan-500/50">
              <div className="absolute inset-0 pointer-events-none">
                {/* Energy Particles */}
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="energy-particle bg-cyan-400"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random(),
                      animation: `pulse ${2 + Math.random() * 3}s infinite ease-in-out ${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-4xl z-10">
                {/* Source Manga Panel */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-slate-950 p-2 rounded-lg border border-cyan-500/50">
                    <img src={previewUrl || ''} alt="Source" className="w-48 h-auto grayscale brightness-110 contrast-125" />
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-2 border-cyan-400/30 animate-pulse"></div>
                  </div>
                  <p className="text-[10px] font-bold text-cyan-400 mt-2 text-center uppercase tracking-widest">Manga Source</p>
                </div>

                {/* Energy Flow Animation */}
                <div className="hidden md:flex flex-col items-center gap-2 flex-1">
                  <div className="w-full h-px bg-gradient-to-r from-cyan-500/0 via-cyan-400 to-cyan-500/0 relative">
                    <div className="absolute top-1/2 left-0 w-full h-8 -translate-y-1/2 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className="absolute h-px bg-cyan-400 shadow-[0_0_8px_cyan]"
                          style={{
                            width: '40px',
                            left: '-40px',
                            top: `${i * 6}px`,
                            opacity: 0.5,
                            animation: `flow ${1 + Math.random()}s linear infinite ${i * 0.2}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-500/40 uppercase tracking-[0.3em]">Processing Neural Engine</span>
                </div>

                {/* Target Anime Frame Placeholder */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-blue-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-slate-950 p-2 rounded-lg border border-blue-500/50 w-64 aspect-video flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 animate-pulse"></div>
                    <Loader2 className="text-cyan-400 animate-spin" size={32} />
                    <div className="absolute bottom-2 right-2 text-[8px] font-mono text-cyan-400/50">16:9_CINEMATIC_OUTPUT</div>
                  </div>
                  <p className="text-[10px] font-bold text-blue-400 mt-2 text-center uppercase tracking-widest">Anime Output</p>
                </div>
              </div>

              {/* Scroll Hint */}
              <div className="mt-8 flex flex-col items-center animate-bounce">
                <p className="text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-2">{t.scrollHint}</p>
                <ChevronDown className="text-cyan-400" size={24} />
              </div>

              {/* Progress Bar inspired by image */}
              <div className="mt-16 w-full max-w-3xl">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Smart Inpainting Process</span>
                    <span className="text-xs font-mono text-cyan-500/60 italic">Transforming Panel: "Neural Reconstruction"</span>
                  </div>
                  <span className="text-2xl font-black neon-text italic">
                    {Math.round((steps.filter(s => s.status === 'done').length / steps.length) * 100)}%
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${(steps.filter(s => s.status === 'done').length / steps.length) * 100}%` }}
                  ></div>
                </div>
                
                {/* Step Icons inspired by image */}
                <div className="mt-6 flex justify-between items-center px-4">
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-500 ${step.status === 'done' ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : step.status === 'running' ? 'bg-slate-900 border-cyan-400 text-cyan-400 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-700'}`}>
                          {i === 0 ? <FileText size={20} /> : i === 1 ? <ImageIcon size={20} /> : <Video size={20} />}
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-tighter ${step.status === 'done' ? 'text-cyan-400' : 'text-slate-600'}`}>{step.title.split(' ')[0]}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`w-8 h-px ${steps[i+1].status !== 'idle' ? 'bg-cyan-400 shadow-[0_0_5px_cyan]' : 'bg-slate-800'}`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <style>{`
                @keyframes flow {
                  0% { left: -40px; opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { left: 100%; opacity: 0; }
                }
                @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 0.3; }
                  50% { transform: scale(1.5); opacity: 1; }
                }
              `}</style>
            </div>
          )}

          {panels.length === 0 && !isProcessing && (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-gray-500 h-full">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>{t.uploadPrompt}</p>
            </div>
          )}

          {(panels.length > 0 || pageAnalysis) && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <div className="flex gap-2">
                {panels.length > 0 && (
                  <>
                    <button
                      onClick={resetWorkflow}
                      className="bg-red-900/40 hover:bg-red-900/60 text-red-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-red-500/30"
                      title={t.clearResults}
                    >
                      <RefreshCw size={16} /> {t.newGeneration}
                    </button>
                    <button
                      onClick={generateAllVideos}
                      disabled={videoBatchStatus === 'running' || isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Video size={16} /> {t.generateAllVideos}
                    </button>
                    {videoBatchStatus !== 'idle' && (
                      <button
                        onClick={() => setBatchStatus(videoBatchStatus === 'paused' ? 'running' : 'paused')}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        {videoBatchStatus === 'paused' ? <Play size={16} /> : <Pause size={16} />} 
                        {videoBatchStatus === 'paused' ? t.resume : t.pause}
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={downloadAllAsZip}
                disabled={isZipping || isProcessing}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 border border-gray-700"
              >
                {isZipping ? (
                  <><Loader2 size={16} className="animate-spin" /> {t.processing}</>
                ) : (
                  <><Archive size={16} /> {t.exportProject}</>
                )}
              </button>
            </div>
          )}

          {/* Global Analysis & Script Section */}
          <div id="bible-section">
          {characterBible && (
            <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsBibleCollapsed(!isBibleCollapsed)}>
                <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                  <Users size={22} /> {t.bibleSection}
                </h2>
                {isBibleCollapsed ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronUp size={20} className="text-gray-400" />}
              </div>
              {!isBibleCollapsed && (
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">{t.globalStyle}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      {characterBible.globalStyle}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">{t.characters}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {characterBible.characters.map((char: any, idx: number) => (
                        <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                          <h4 className="font-bold text-emerald-300 mb-1">{char.name}</h4>
                          <p className="text-xs text-gray-400 mb-2">{char.description}</p>
                          <div className="text-xs bg-black/30 p-2 rounded border border-gray-800">
                            <span className="text-gray-500 font-semibold">{t.colors}:</span> {char.colorPalette}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>

          <div id="script-section">
          {(pageAnalysis || globalScript) && (
            <div className="glass-panel p-6 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)}>
                <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                  <FileText size={22} /> {t.globalScript}
                </h2>
                {isAnalysisCollapsed ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronUp size={20} className="text-gray-400" />}
              </div>
              {!isAnalysisCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">{t.pageContext}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      {pageAnalysis}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">{t.animeScript}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/50 p-4 rounded-lg border border-gray-800 whitespace-pre-wrap font-mono">
                      {globalScript}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>

          {/* Individual Panels */}
          <div id="panels-section" className="flex flex-col gap-6">
          {panels.map((panel, index) => (
            <div key={panel.id} id={`panel-${index}`} className="glass-panel p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between border-b border-gray-800 pb-4 cursor-pointer" onClick={() => updatePanel(panel.id, { isCollapsed: !panel.isCollapsed })}>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                    {t.panel} {index + 1}
                    {panel.isCollapsed ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronUp size={18} className="text-gray-500" />}
                  </h3>
                  <div className="relative group mt-2">
                    <p className="text-gray-300 font-medium bg-gray-900 px-3 py-2 rounded-lg border border-gray-800 pr-10">
                      "{panel.dialogue}"
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTextToClipboard(panel.dialogue, `dialogue-${panel.id}`);
                      }}
                      className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title={t.copyImage}
                    >
                      {copiedId === `dialogue-${panel.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                {panel.error && (
                  <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-900 ml-4">
                    {panel.error}
                  </div>
                )}
              </div>

              {!panel.isCollapsed && (
                <>
                  {panel.croppedImageUrl && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                        <ImageIcon size={14} className="text-emerald-400" /> {t.originalPanel}
                      </h4>
                      <div className="bg-black rounded-lg border border-gray-800 p-2 inline-block max-w-full overflow-hidden relative group">
                        <img src={panel.croppedImageUrl} alt={`Case ${index + 1}`} className="max-h-48 object-contain rounded" />
                        <button 
                          onClick={() => copyImageToClipboard(panel.croppedImageUrl!, `img-crop-${panel.id}`)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium rounded-lg"
                        >
                          {copiedId === `img-crop-${panel.id}` ? <Check className="text-emerald-400" size={24} /> : <Copy size={24} />}
                          {copiedId === `img-crop-${panel.id}` ? t.copied : t.copyImage}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Frame */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                      <Palette size={14} className="text-indigo-400" /> {t.firstFrame}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updatePanel(panel.id, { showPromptFirst: !panel.showPromptFirst })}
                        className={`text-xs flex items-center gap-1 transition-colors ${panel.showPromptFirst ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                        title={t.showPrompt}
                      >
                        <MessageSquare size={14} />
                      </button>
                      {panel.firstFrameUrl && (
                        <>
                          <button
                            onClick={() => updatePanel(panel.id, { isEditingFirst: !panel.isEditingFirst })}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            title={t.edit}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(panel.firstFrameUrl!, getFilename(index, panel.dialogue, 'first'))}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            title={t.download}
                          >
                            <Download size={14} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => regenerateFrame(panel.id, 'first')}
                        disabled={panel.isGeneratingFirst}
                        className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={panel.isGeneratingFirst ? "animate-spin" : ""} /> {t.regenerate}
                      </button>
                    </div>
                  </div>
                  <div className="aspect-video bg-black rounded-lg border border-gray-800 overflow-hidden relative flex items-center justify-center group">
                    {panel.isGeneratingFirst ? (
                      <Loader2 className="animate-spin text-indigo-500" size={24} />
                    ) : panel.firstFrameUrl ? (
                      <>
                        <img src={panel.firstFrameUrl} alt="First Frame" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => copyImageToClipboard(panel.firstFrameUrl!, `img-first-${panel.id}`)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium"
                        >
                          {copiedId === `img-first-${panel.id}` ? <Check className="text-emerald-400" size={24} /> : <Copy size={24} />}
                          {copiedId === `img-first-${panel.id}` ? t.copied : t.copyImage}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">{t.imageNotAvailable}</span>
                    )}
                  </div>
                  {panel.isEditingFirst && (
                    <div className="mt-2 flex gap-2">
                      <input 
                        type="text" 
                        value={panel.editPromptFirst || ''} 
                        onChange={e => updatePanel(panel.id, { editPromptFirst: e.target.value })}
                        placeholder={t.editPromptPlaceholder} 
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={() => submitEditFrame(panel.id, 'first')}
                        disabled={!panel.editPromptFirst || panel.isGeneratingFirst}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        {t.confirm}
                      </button>
                    </div>
                  )}
                  {panel.showPromptFirst && (
                    <div className="mt-2 relative group">
                      <label className="text-xs text-gray-400 mb-1 block">{t.generationPrompt}</label>
                      <textarea 
                        value={panel.firstFramePrompt || ''} 
                        onChange={e => updatePanel(panel.id, { firstFramePrompt: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                      />
                      <button 
                        onClick={() => copyTextToClipboard(panel.firstFramePrompt || '', `prompt-first-${panel.id}`)}
                        className="absolute top-6 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title={t.copyPrompt}
                      >
                        {copiedId === `prompt-first-${panel.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Last Frame */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                      <Palette size={14} className="text-indigo-400" /> {t.lastFrame}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updatePanel(panel.id, { showPromptLast: !panel.showPromptLast })}
                        className={`text-xs flex items-center gap-1 transition-colors ${panel.showPromptLast ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                        title={t.showPrompt}
                      >
                        <MessageSquare size={14} />
                      </button>
                      {panel.lastFrameUrl && (
                        <>
                          <button
                            onClick={() => updatePanel(panel.id, { isEditingLast: !panel.isEditingLast })}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            title={t.edit}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(panel.lastFrameUrl!, getFilename(index, panel.dialogue, 'last'))}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            title={t.download}
                          >
                            <Download size={14} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => regenerateFrame(panel.id, 'last')}
                        disabled={panel.isGeneratingLast}
                        className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={panel.isGeneratingLast ? "animate-spin" : ""} /> {t.regenerate}
                      </button>
                    </div>
                  </div>
                  <div className="aspect-video bg-black rounded-lg border border-gray-800 overflow-hidden relative flex items-center justify-center group">
                    {panel.isGeneratingLast ? (
                      <Loader2 className="animate-spin text-indigo-500" size={24} />
                    ) : panel.lastFrameUrl ? (
                      <>
                        <img src={panel.lastFrameUrl} alt="Last Frame" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => copyImageToClipboard(panel.lastFrameUrl!, `img-last-${panel.id}`)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium"
                        >
                          {copiedId === `img-last-${panel.id}` ? <Check className="text-emerald-400" size={24} /> : <Copy size={24} />}
                          {copiedId === `img-last-${panel.id}` ? t.copied : t.copyImage}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">{t.imageNotAvailable}</span>
                    )}
                  </div>
                  {panel.isEditingLast && (
                    <div className="mt-2 flex gap-2">
                      <input 
                        type="text" 
                        value={panel.editPromptLast || ''} 
                        onChange={e => updatePanel(panel.id, { editPromptLast: e.target.value })}
                        placeholder={t.editPromptPlaceholder} 
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={() => submitEditFrame(panel.id, 'last')}
                        disabled={!panel.editPromptLast || panel.isGeneratingLast}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        {t.confirm}
                      </button>
                    </div>
                  )}
                  {panel.showPromptLast && (
                    <div className="mt-2 relative group">
                      <label className="text-xs text-gray-400 mb-1 block">{t.generationPrompt}</label>
                      <textarea 
                        value={panel.lastFramePrompt || ''} 
                        onChange={e => updatePanel(panel.id, { lastFramePrompt: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                      />
                      <button 
                        onClick={() => copyTextToClipboard(panel.lastFramePrompt || '', `prompt-last-${panel.id}`)}
                        className="absolute top-6 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title={t.copyPrompt}
                      >
                        {copiedId === `prompt-last-${panel.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Generation Section */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 relative group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{t.detailedVideoPrompt}</span>
                      <button 
                        onClick={() => updatePanel(panel.id, { isEditingVideoPrompt: !panel.isEditingVideoPrompt })}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                        title={t.edit}
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                    
                    {panel.isEditingVideoPrompt ? (
                      <div className="relative">
                        <textarea
                          value={panel.videoPrompt}
                          onChange={(e) => updatePanel(panel.id, { videoPrompt: e.target.value })}
                          className="w-full bg-gray-900 border border-indigo-500 rounded p-3 text-sm text-gray-300 focus:outline-none min-h-[80px] font-mono"
                        />
                        <button 
                          onClick={() => updatePanel(panel.id, { isEditingVideoPrompt: false })}
                          className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors"
                        >
                          {t.confirm}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic mt-1 bg-gray-900/50 p-3 rounded border border-gray-800 pr-10">
                        "{panel.speaker && panel.speaker !== 'Narrator' && panel.speaker !== 'Action' 
                          ? `${panel.speaker} ${t.isSpeaking}: "${panel.dialogue}". ${panel.videoPrompt}`
                          : `${t.dialogueSpoken}: "${panel.dialogue}". ${panel.videoPrompt}`}"
                      </p>
                    )}
                    
                    {!panel.isEditingVideoPrompt && (
                      <button 
                        onClick={() => {
                          const text = panel.speaker && panel.speaker !== 'Narrator' && panel.speaker !== 'Action' 
                            ? `${panel.speaker} ${t.isSpeaking}: "${panel.dialogue}". ${panel.videoPrompt}`
                            : `${t.dialogueSpoken}: "${panel.dialogue}". ${panel.videoPrompt}`;
                          copyTextToClipboard(text, `prompt-video-${panel.id}`);
                        }}
                        className="absolute top-6 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title={t.copyImage}
                      >
                        {copiedId === `prompt-video-${panel.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                  
                  {!panel.videoUrl ? (
                    <div className="flex flex-col gap-3 shrink-0">
                      {!panel.isAnimationOptionsOpen ? (
                        <button
                          onClick={() => updatePanel(panel.id, { isAnimationOptionsOpen: true })}
                          disabled={panel.isGeneratingVideo || !panel.firstFrameUrl}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                          {panel.isGeneratingVideo ? (
                            <><Loader2 size={16} className="animate-spin" /> {t.veoGenerating}</>
                          ) : (
                            <><Video size={16} /> {t.generateVideo}</>
                          )}
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              updatePanel(panel.id, { animationChoice: 'veo', isAnimationOptionsOpen: false });
                              generatePanelVideo(panel.id);
                            }}
                            disabled={panel.isGeneratingVideo}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                          >
                            <MonitorPlay size={14} /> {t.autoVeo}
                          </button>
                          <button
                            onClick={() => updatePanel(panel.id, { animationChoice: 'grok', isAnimationOptionsOpen: false })}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                          >
                            <MonitorPlay size={14} /> {t.manualGrok}
                          </button>
                          <button
                            onClick={() => updatePanel(panel.id, { animationChoice: 'kling', isAnimationOptionsOpen: false })}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                          >
                            <MonitorPlay size={14} /> {t.manualKling}
                          </button>
                          <button
                            onClick={() => updatePanel(panel.id, { isAnimationOptionsOpen: false })}
                            className="text-[10px] text-gray-500 hover:text-gray-300 text-center"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="shrink-0 w-full md:w-64 aspect-video bg-black rounded-lg border border-emerald-900 overflow-hidden">
                      <video src={panel.videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {(panel.animationChoice === 'grok' || panel.animationChoice === 'kling') && !panel.videoUrl && (
                <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-xl flex flex-col gap-4">
                  <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 text-sm text-indigo-200">
                    <p className="flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      {t.manualInstructions}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href={panel.animationChoice === 'grok' ? "https://grok.com/imagine" : "https://klingai.com"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-bold shadow-lg text-lg"
                    >
                      <MonitorPlay size={24} />
                      {panel.animationChoice === 'grok' ? t.openGrok : t.openKling}
                    </a>
                    <button 
                      onClick={() => updatePanel(panel.id, { animationChoice: undefined })}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-xl transition-colors font-bold"
                    >
                      {t.close}
                    </button>
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          ))}
          </div>

        </div>

      </div>
      </div>
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Backdrop with hole */}
          <div 
            className="absolute inset-0 bg-black/60"
            style={{
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${tutorialPosition.left}px 100%, 
                ${tutorialPosition.left}px ${tutorialPosition.top}px, 
                ${tutorialPosition.left + tutorialPosition.width}px ${tutorialPosition.top}px, 
                ${tutorialPosition.left + tutorialPosition.width}px ${tutorialPosition.top + tutorialPosition.height}px, 
                ${tutorialPosition.left}px ${tutorialPosition.top + tutorialPosition.height}px, 
                ${tutorialPosition.left}px 100%, 
                100% 100%, 
                100% 0%
              )`,
              transition: 'clip-path 0.3s ease'
            }}
          />
          
          {/* Tooltip */}
          <div 
            className="absolute pointer-events-auto"
            style={{
              top: tutorialPosition.top + tutorialPosition.height + 20 > window.innerHeight - 280 
                ? Math.max(20, tutorialPosition.top - 280)
                : tutorialPosition.top + tutorialPosition.height + 20,
              left: Math.max(20, Math.min(window.innerWidth - 340, tutorialPosition.left + (tutorialPosition.width / 2) - 160)),
              width: '320px',
              transition: 'top 0.3s ease, left 0.3s ease'
            }}
          >
            <div className="bg-gray-900 border border-indigo-500/50 rounded-2xl p-6 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {tutorialStep + 1} / {tutorialSteps.length}
                </span>
                <button onClick={handleSkipTutorial} className="text-gray-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{tutorialSteps[tutorialStep].title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {tutorialSteps[tutorialStep].desc}
              </p>
              <div className="flex items-center justify-between">
                <button 
                  onClick={handleSkipTutorial}
                  className="text-gray-500 hover:text-white text-sm font-medium transition-colors"
                >
                  {t.skip}
                </button>
                <button 
                  onClick={handleNextTutorial}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                  {tutorialStep === tutorialSteps.length - 1 ? t.finish : t.next}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Scroll Navigation */}
      {showScrollNav && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-slate-900/80 border border-cyan-500/30 p-3 rounded-full text-cyan-400 hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] backdrop-blur-md"
            title={t.navTop}
          >
            <ArrowUp size={20} />
          </button>
          <div className="bg-slate-900/80 border border-cyan-500/30 p-2 rounded-2xl flex flex-col gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <button 
              onClick={() => document.getElementById('bible-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all"
              title={t.navBible}
            >
              <Users size={20} />
            </button>
            <button 
              onClick={() => document.getElementById('script-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition-all"
              title={t.navScript}
            >
              <FileText size={20} />
            </button>
            <button 
              onClick={() => document.getElementById('panels-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all"
              title={t.navPanels}
            >
              <Layout size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

