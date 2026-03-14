/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, CheckCircle, Loader2, Image as ImageIcon, FileText, Video, Wand2, AlertCircle, RefreshCw, Palette, Download, Settings, Pencil, MessageSquare, Archive, Users, File, ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen, Globe, List, MonitorPlay, Copy, Check } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { analyzeMangaPage, generateAnimeFrame, generateVideo, editAnimeFrame, extractCharacterBible } from './lib/ai';

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
    french: "Français",
    english: "Anglais",
    spanish: "Espagnol",
    arabic: "Arabe",
    japanese: "Japonais",
    chinese: "Chinois",
    fast: "Rapide",
    hq: "HQ"
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
    french: "French",
    english: "English",
    spanish: "Spanish",
    arabic: "Arabic",
    japanese: "Japanese",
    chinese: "Chinese",
    fast: "Fast",
    hq: "HQ"
  }
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isExtractingBible, setIsExtractingBible] = useState(false);
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
  const [uiLanguage, setUiLanguage] = useState<'fr' | 'en'>('fr');

  const t = translations[uiLanguage];

  const [videoBatchStatus, setVideoBatchStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const videoBatchStatusRef = useRef<'idle' | 'running' | 'paused'>('idle');

  const [isBibleCollapsed, setIsBibleCollapsed] = useState(false);
  const [isAnalysisCollapsed, setIsAnalysisCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const panelsRef = useRef<PanelData[]>([]);
  useEffect(() => {
    panelsRef.current = panels;
  }, [panels]);

  const setBatchStatus = (status: 'idle' | 'running' | 'paused') => {
    setVideoBatchStatus(status);
    videoBatchStatusRef.current = status;
  };

  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: 1, title: 'Analyse & Extraction', description: 'Script global & Découpage', status: 'idle' },
    { id: 2, title: 'Colorisation & 16:9', description: 'Génération First/Last Frames', status: 'idle' },
    { id: 3, title: 'Génération Vidéo', description: 'Animation Veo (Optionnel)', status: 'idle' },
  ]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
        setError("Veuillez uploader un fichier PDF valide.");
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
      setError(err.message || "Erreur lors de l'extraction de la bible des personnages.");
    } finally {
      setIsExtractingBible(false);
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
        error: `Erreur modification frame: ${err.message}`,
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
          updatePanel(panelId, { error: "Clé API requise pour la vidéo." });
          return;
        }
      }
    }

    updatePanel(panelId, { isGeneratingVideo: true, error: undefined });
    updateStep(3, 'running');

    try {
      const fullVideoPrompt = panel.speaker && panel.speaker !== 'Narrator' && panel.speaker !== 'Action' 
        ? `${panel.speaker} is speaking: "${panel.dialogue}". ${panel.videoPrompt}`
        : `Dialogue spoken: "${panel.dialogue}". ${panel.videoPrompt}`;
      const videoUrl = await generateVideo(panel.firstFrameUrl, panel.lastFrameUrl || null, fullVideoPrompt);
      updatePanel(panelId, { videoUrl, isGeneratingVideo: false });
      updateStep(3, 'done');
    } catch (err: any) {
      console.error(err);
      updatePanel(panelId, { error: `Erreur vidéo: ${err.message}`, isGeneratingVideo: false });
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
          setError("Clé API requise pour la génération de vidéos en lot.");
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
          reject(new Error("Impossible de créer le contexte canvas"));
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
      img.onerror = () => reject(new Error("Erreur lors du chargement de l'image pour le recadrage"));
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
      const extractedData = await analyzeMangaPage(base64Image, mimeType, characterBible, analysisModel, language);
      
      setPageAnalysis(extractedData.pageAnalysis);
      setGlobalScript(extractedData.globalScript);

      const initializedPanels: PanelData[] = await Promise.all(extractedData.panels.map(async (p: any, index: number) => {
        let croppedImageUrl;
        if (p.boundingBox) {
          try {
            croppedImageUrl = await cropImage(base64Image, p.boundingBox);
          } catch (e) {
            console.error("Erreur lors du recadrage", e);
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
      
      for (const panel of initializedPanels) {
        // Generate First Frame
        let firstUrl = '';
        try {
          const refImage = panel.croppedImageUrl || base64Image;
          const refMime = panel.croppedImageUrl ? 'image/jpeg' : mimeType;
          firstUrl = await generateAnimeFrame(panel.firstFramePrompt, refImage, refMime, imageModel, false);
          updatePanel(panel.id, { firstFrameUrl: firstUrl, isGeneratingFirst: false });
        } catch (e) {
          updatePanel(panel.id, { isGeneratingFirst: false, error: "Erreur First Frame" });
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
          updatePanel(panel.id, { isGeneratingLast: false, error: "Erreur Last Frame" });
        }
      }
      
      updateStep(2, 'done');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors du traitement.");
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wand2 className="text-indigo-500" />
            {t.title}
          </h1>
          <p className="text-gray-400 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
            v2.1.0-colorized
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
          <div className={`glass-panel ${isSidebarCollapsed ? 'p-4 flex justify-center cursor-pointer hover:bg-gray-800/50' : 'p-6'}`} onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}>
            {isSidebarCollapsed ? (
              <Settings size={24} className="text-indigo-400" title={t.settings} />
            ) : (
              <>
                <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Settings size={18} className="text-indigo-400" /> {t.settings}
                  </h2>
                  {isSettingsCollapsed ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronUp size={18} className="text-gray-500" />}
                </div>
                {!isSettingsCollapsed && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Globe size={12}/> {t.uiLanguage}</label>
                        <select value={uiLanguage} onChange={e => setUiLanguage(e.target.value as 'fr' | 'en')} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                          <option value="fr">{t.french}</option>
                          <option value="en">{t.english}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Globe size={12}/> {t.targetLanguage}</label>
                        <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                          <option value="français">{t.french}</option>
                          <option value="anglais">{t.english}</option>
                          <option value="espagnol">{t.spanish}</option>
                          <option value="arabe">{t.arabic}</option>
                          <option value="japonais">{t.japanese}</option>
                          <option value="chinois">{t.chinese}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">{t.analysisModel}</label>
                        <select value={analysisModel} onChange={e => setAnalysisModel(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                          <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-flash-8b">Gemini 2.5 Flash-8B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">{t.bibleModel}</label>
                        <select value={bibleModel} onChange={e => setBibleModel(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                          <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-flash-8b">Gemini 2.5 Flash-8B</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1">{t.imageModel}</label>
                        <select value={imageModel} onChange={e => setImageModel(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                          <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image ({t.hq})</option>
                          <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image ({t.fast})</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1">{t.videoModel}</label>
                        <select value={videoModel} onChange={e => setVideoModel(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
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
          <div className={`glass-panel ${isSidebarCollapsed ? 'p-4 flex justify-center cursor-pointer hover:bg-gray-800/50' : 'p-6'}`} onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}>
            {isSidebarCollapsed ? (
              <FileText size={24} className="text-emerald-400" title="Contexte" />
            ) : (
              <>
                <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => setIsContextCollapsed(!isContextCollapsed)}>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText size={18} className="text-emerald-400" /> 1. Contexte (Optionnel)
                  </h2>
                  {isContextCollapsed ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronUp size={18} className="text-gray-500" />}
                </div>
                {!isContextCollapsed && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400 mb-4">
                      Uploadez un PDF du manga pour extraire la Bible des Personnages. Cela aidera l'IA à coloriser de manière cohérente.
                    </p>
                    
                    {!pdfFile ? (
                      <div 
                        onClick={() => pdfInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingPdf(false); }}
                        onDrop={handlePdfDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                          isDraggingPdf 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-gray-700 hover:border-emerald-500/50 bg-gray-900/50'
                        }`}
                      >
                        <File className={`mx-auto mb-2 ${isDraggingPdf ? 'text-emerald-400' : 'text-gray-500'}`} size={24} />
                        <p className="text-sm text-gray-300 font-medium">
                          {isDraggingPdf ? 'Relâchez pour uploader' : 'Cliquez ou glissez un PDF ici'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <File className="text-emerald-500 shrink-0" size={20} />
                            <span className="text-sm text-gray-200 truncate">{pdfFile.name}</span>
                          </div>
                          <button 
                            onClick={() => { setPdfFile(null); setCharacterBible(null); }}
                            className="text-gray-500 hover:text-red-400 p-1"
                            disabled={isExtractingBible || isProcessing}
                          >
                            <Archive size={16} />
                          </button>
                        </div>

                        {pdfFile && !characterBible && (
                          <button
                            onClick={handleExtractBible}
                            disabled={isExtractingBible || isProcessing}
                            className="w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors border border-emerald-500/30"
                          >
                            {isExtractingBible ? (
                              <><Loader2 size={16} className="animate-spin" /> Extraction en cours...</>
                            ) : (
                              <><Users size={16} /> Extraire la Bible des Personnages</>
                            )}
                          </button>
                        )}
                        
                        {characterBible && (
                          <div className="text-sm text-emerald-400 flex items-center gap-2 justify-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                            <CheckCircle size={16} /> Bible extraite avec succès
                          </div>
                        )}
                      </div>
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
          <div className={`glass-panel ${isSidebarCollapsed ? 'p-4 flex justify-center cursor-pointer hover:bg-gray-800/50' : 'p-6'}`} onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}>
            {isSidebarCollapsed ? (
              <Upload size={24} className="text-indigo-400" title="Upload Image" />
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload size={18} className="text-indigo-400" /> 2. Page à coloriser
                </h2>
                
                {!previewUrl ? (
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingImage(false); }}
                    onDrop={handleImageDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDraggingImage 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-gray-700 hover:border-indigo-500 bg-gray-900/50'
                    }`}
                  >
                    <ImageIcon className={`mx-auto mb-3 ${isDraggingImage ? 'text-indigo-400' : 'text-gray-500'}`} size={32} />
                    <p className="text-sm text-gray-300 font-medium">
                      {isDraggingImage ? 'Relâchez pour uploader' : t.uploadImage}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Formats supportés: JPG, PNG</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-black group">
                      <img src={previewUrl} alt="Preview" className="w-full h-auto object-contain max-h-[300px] opacity-80 group-hover:opacity-100 transition-opacity" />
                      <button 
                        onClick={() => { setFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-red-500/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm transition-colors"
                        disabled={isProcessing}
                      >
                        Changer
                      </button>
                    </div>

                    <button
                      onClick={startWorkflow}
                      disabled={!file || isProcessing || isExtractingBible}
                      className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                        !file || isProcessing || isExtractingBible
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                      }`}
                    >
                      {isProcessing ? (
                        <><Loader2 size={18} className="animate-spin" /> Traitement en cours...</>
                      ) : (
                        <><Play size={18} /> {characterBible ? 'Extraire & Coloriser (avec Contexte)' : 'Extraire & Coloriser'}</>
                      )}
                    </button>
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
              <h2 className="text-lg font-semibold mb-6">Pipeline d'Exécution</h2>
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
        <div className={`transition-all duration-300 flex flex-col gap-6 ${isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-8'}`}>
          
          {panels.length === 0 && !isProcessing && (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-gray-500 h-full">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>Uploadez une page et lancez le workflow pour voir l'analyse et les cases extraites.</p>
            </div>
          )}

          {(panels.length > 0 || pageAnalysis) && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <div className="flex gap-2">
                {panels.length > 0 && (
                  <>
                    <button
                      onClick={generateAllVideos}
                      disabled={videoBatchStatus === 'running' || isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Video size={16} /> Générer toutes les vidéos
                    </button>
                    {videoBatchStatus !== 'idle' && (
                      <button
                        onClick={() => setBatchStatus(videoBatchStatus === 'paused' ? 'running' : 'paused')}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        {videoBatchStatus === 'paused' ? <Play size={16} /> : <Pause size={16} />} 
                        {videoBatchStatus === 'paused' ? 'Reprendre' : 'Pause'}
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
                  <><Loader2 size={16} className="animate-spin" /> Création du ZIP...</>
                ) : (
                  <><Archive size={16} /> Tout télécharger (ZIP)</>
                )}
              </button>
            </div>
          )}

          {/* Global Analysis & Script Section */}
          {characterBible && (
            <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsBibleCollapsed(!isBibleCollapsed)}>
                <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                  <Users size={22} /> Bible des Personnages & Style
                </h2>
                {isBibleCollapsed ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronUp size={20} className="text-gray-400" />}
              </div>
              {!isBibleCollapsed && (
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Style Global de l'Oeuvre</h3>
                    <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      {characterBible.globalStyle}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Personnages Extraits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {characterBible.characters.map((char: any, idx: number) => (
                        <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                          <h4 className="font-bold text-emerald-300 mb-1">{char.name}</h4>
                          <p className="text-xs text-gray-400 mb-2">{char.description}</p>
                          <div className="text-xs bg-black/30 p-2 rounded border border-gray-800">
                            <span className="text-gray-500 font-semibold">Couleurs:</span> {char.colorPalette}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(pageAnalysis || globalScript) && (
            <div className="glass-panel p-6 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)}>
                <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                  <FileText size={22} /> Analyse Globale & Script
                </h2>
                {isAnalysisCollapsed ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronUp size={20} className="text-gray-400" />}
              </div>
              {!isAnalysisCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Contexte de la page</h3>
                    <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      {pageAnalysis}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Script Anime</h3>
                    <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/50 p-4 rounded-lg border border-gray-800 whitespace-pre-wrap font-mono">
                      {globalScript}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Panels */}
          {panels.map((panel, index) => (
            <div key={panel.id} className="glass-panel p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between border-b border-gray-800 pb-4 cursor-pointer" onClick={() => updatePanel(panel.id, { isCollapsed: !panel.isCollapsed })}>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                    Panneau {index + 1}
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
                      title="Copier le dialogue"
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
                        <ImageIcon size={14} className="text-emerald-400" /> Case Originale Extraite
                      </h4>
                      <div className="bg-black rounded-lg border border-gray-800 p-2 inline-block max-w-full overflow-hidden relative group">
                        <img src={panel.croppedImageUrl} alt={`Case ${index + 1}`} className="max-h-48 object-contain rounded" />
                        <button 
                          onClick={() => copyImageToClipboard(panel.croppedImageUrl!, `img-crop-${panel.id}`)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium rounded-lg"
                        >
                          {copiedId === `img-crop-${panel.id}` ? <Check className="text-emerald-400" size={24} /> : <Copy size={24} />}
                          {copiedId === `img-crop-${panel.id}` ? 'Copié !' : 'Copier l\'image'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Frame */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                      <Palette size={14} className="text-indigo-400" /> First Frame (Colorisée 16:9)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updatePanel(panel.id, { showPromptFirst: !panel.showPromptFirst })}
                        className={`text-xs flex items-center gap-1 transition-colors ${panel.showPromptFirst ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                        title="Afficher/Modifier le prompt"
                      >
                        <MessageSquare size={14} />
                      </button>
                      {panel.firstFrameUrl && (
                        <>
                          <button
                            onClick={() => updatePanel(panel.id, { isEditingFirst: !panel.isEditingFirst })}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(panel.firstFrameUrl!, getFilename(index, panel.dialogue, 'first'))}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            title="Télécharger"
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
                        <RefreshCw size={12} className={panel.isGeneratingFirst ? "animate-spin" : ""} /> Régénérer
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
                          {copiedId === `img-first-${panel.id}` ? 'Copié !' : 'Copier l\'image'}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">Image non disponible</span>
                    )}
                  </div>
                  {panel.isEditingFirst && (
                    <div className="mt-2 flex gap-2">
                      <input 
                        type="text" 
                        value={panel.editPromptFirst || ''} 
                        onChange={e => updatePanel(panel.id, { editPromptFirst: e.target.value })}
                        placeholder="Prompt de modification..." 
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={() => submitEditFrame(panel.id, 'first')}
                        disabled={!panel.editPromptFirst || panel.isGeneratingFirst}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Valider
                      </button>
                    </div>
                  )}
                  {panel.showPromptFirst && (
                    <div className="mt-2 relative group">
                      <label className="text-xs text-gray-400 mb-1 block">Prompt de génération :</label>
                      <textarea 
                        value={panel.firstFramePrompt || ''} 
                        onChange={e => updatePanel(panel.id, { firstFramePrompt: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                      />
                      <button 
                        onClick={() => copyTextToClipboard(panel.firstFramePrompt || '', `prompt-first-${panel.id}`)}
                        className="absolute top-6 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Copier le prompt"
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
                      <Palette size={14} className="text-indigo-400" /> Last Frame (Colorisée 16:9)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updatePanel(panel.id, { showPromptLast: !panel.showPromptLast })}
                        className={`text-xs flex items-center gap-1 transition-colors ${panel.showPromptLast ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                        title="Afficher/Modifier le prompt"
                      >
                        <MessageSquare size={14} />
                      </button>
                      {panel.lastFrameUrl && (
                        <>
                          <button
                            onClick={() => updatePanel(panel.id, { isEditingLast: !panel.isEditingLast })}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(panel.lastFrameUrl!, getFilename(index, panel.dialogue, 'last'))}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            title="Télécharger"
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
                        <RefreshCw size={12} className={panel.isGeneratingLast ? "animate-spin" : ""} /> Régénérer
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
                          {copiedId === `img-last-${panel.id}` ? 'Copié !' : 'Copier l\'image'}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">Image non disponible</span>
                    )}
                  </div>
                  {panel.isEditingLast && (
                    <div className="mt-2 flex gap-2">
                      <input 
                        type="text" 
                        value={panel.editPromptLast || ''} 
                        onChange={e => updatePanel(panel.id, { editPromptLast: e.target.value })}
                        placeholder="Prompt de modification..." 
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={() => submitEditFrame(panel.id, 'last')}
                        disabled={!panel.editPromptLast || panel.isGeneratingLast}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Valider
                      </button>
                    </div>
                  )}
                  {panel.showPromptLast && (
                    <div className="mt-2 relative group">
                      <label className="text-xs text-gray-400 mb-1 block">Prompt de génération :</label>
                      <textarea 
                        value={panel.lastFramePrompt || ''} 
                        onChange={e => updatePanel(panel.id, { lastFramePrompt: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                      />
                      <button 
                        onClick={() => copyTextToClipboard(panel.lastFramePrompt || '', `prompt-last-${panel.id}`)}
                        className="absolute top-6 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Copier le prompt"
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
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Prompt Vidéo Détaillé</span>
                    <p className="text-sm text-gray-400 italic mt-1 bg-gray-900/50 p-3 rounded border border-gray-800 pr-10">
                      "{panel.speaker && panel.speaker !== 'Narrator' && panel.speaker !== 'Action' 
                        ? `${panel.speaker} is speaking: "${panel.dialogue}". ${panel.videoPrompt}`
                        : `Dialogue spoken: "${panel.dialogue}". ${panel.videoPrompt}`}"
                    </p>
                    <button 
                      onClick={() => {
                        const text = panel.speaker && panel.speaker !== 'Narrator' && panel.speaker !== 'Action' 
                          ? `${panel.speaker} is speaking: "${panel.dialogue}". ${panel.videoPrompt}`
                          : `Dialogue spoken: "${panel.dialogue}". ${panel.videoPrompt}`;
                        copyTextToClipboard(text, `prompt-video-${panel.id}`);
                      }}
                      className="absolute top-6 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Copier le prompt vidéo"
                    >
                      {copiedId === `prompt-video-${panel.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
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
                            <><Loader2 size={16} className="animate-spin" /> Génération Veo...</>
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
                            Annuler
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
                      {panel.animationChoice === 'grok' ? "Ouvrir Grok Imagine" : "Ouvrir Kling AI"}
                    </a>
                    <button 
                      onClick={() => updatePanel(panel.id, { animationChoice: undefined })}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-xl transition-colors font-bold"
                    >
                      Fermer
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
  );
}

