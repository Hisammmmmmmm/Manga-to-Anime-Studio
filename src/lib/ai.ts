import { GoogleGenAI, Type } from '@google/genai';

// Helper to get the AI client. We check process.env.API_KEY first because
// the Veo video model requires the user to select their own paid API key,
// which is injected into process.env.API_KEY by the AI Studio platform.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

export async function analyzeMangaPage(base64Image: string, mimeType: string, characterBible?: any, modelName: string = 'gemini-3.1-pro-preview', language: string = 'français') {
  const ai = getAI();
  
  // Remove the data URI prefix if present
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  let promptText = `Analyse cette page de manga en détail. Analyse attentivement LE STYLE DE DESSIN ET LES COULEURS (ou déduis une palette de couleurs cohérente si c'est en noir et blanc). Fournis au format JSON :\n1. pageAnalysis: Un résumé global très détaillé incluant les lieux, les personnages présents, leurs émotions, l'action en cours, et une analyse poussée du STYLE DE DESSIN et de la PALETTE DE COULEURS.\n2. globalScript: Un script global très détaillé au format anime (avec descriptions précises des lieux, des personnages, des émotions, des actions, indications de mise en scène, voix off, effets sonores).\n3. panels: Un tableau pour chaque bulle de dialogue ou action clé. Pour chaque panneau :\n   - speaker: Le nom du personnage qui parle (ou 'Narrator' / 'Action' si pas de dialogue).\n   - dialogue: Le texte de la bulle (TRADUIT EN ${language.toUpperCase()}).\n   - boundingBox: Les coordonnées de la case (panel) du manga correspondant à cette action. Utilise un objet avec ymin, xmin, ymax, xmax (valeurs proportionnelles entre 0 et 1000, où 0,0 est le coin supérieur gauche et 1000,1000 le coin inférieur droit de l'image originale).\n   - firstFramePrompt: Description visuelle TRÈS DÉTAILLÉE EN ANGLAIS du début de l'action (personnages, émotions, décor, pose). INCLUS OBLIGATOIREMENT LA PALETTE DE COULEURS ET LE STYLE DE DESSIN ANALYSÉ. AJOUTE À LA FIN: '16:9, full frame, NO speech bubbles, NO text, NO manga panels, NO borders'.\n   - lastFramePrompt: Description visuelle TRÈS DÉTAILLÉE EN ANGLAIS de la fin de l'action. INCLUS LA PALETTE DE COULEURS ET LE STYLE DE DESSIN. AJOUTE: '16:9, full frame, NO speech bubbles, NO text, NO manga panels, NO borders'.\n   - videoPrompt: Un prompt vidéo TRÈS DÉTAILLÉ EN ANGLAIS optimisé pour un générateur vidéo (ex: Veo). Décris l'action comme une prise de vue cinématographique ('Cinematic shot of...'). Si le personnage parle, décris-le en train de parler ('talking, lips moving'). Inclus les mouvements de caméra, les émotions, l'ambiance lumineuse.`;

  if (characterBible) {
    promptText += `\n\nIMPORTANT - BIBLE DES PERSONNAGES ET STYLE GLOBAL :\nVoici les informations extraites de l'oeuvre complète :\nStyle Global: ${characterBible.globalStyle}\nPersonnages:\n${characterBible.characters.map((c: any) => `- ${c.name}: ${c.description}. Couleurs: ${c.colorPalette}`).join('\n')}\n\nUTILISE CES DESCRIPTIONS ET COULEURS EXACTES dans les firstFramePrompt et lastFramePrompt lorsque ces personnages apparaissent dans la page.`;
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        inlineData: { data: base64Data, mimeType }
      },
      {
        text: promptText
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pageAnalysis: { type: Type.STRING },
          globalScript: { type: Type.STRING },
          panels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING },
                dialogue: { type: Type.STRING },
                boundingBox: {
                  type: Type.OBJECT,
                  properties: {
                    ymin: { type: Type.NUMBER },
                    xmin: { type: Type.NUMBER },
                    ymax: { type: Type.NUMBER },
                    xmax: { type: Type.NUMBER }
                  },
                  required: ["ymin", "xmin", "ymax", "xmax"]
                },
                firstFramePrompt: { type: Type.STRING },
                lastFramePrompt: { type: Type.STRING },
                videoPrompt: { type: Type.STRING }
              },
              required: ["speaker", "dialogue", "boundingBox", "firstFramePrompt", "lastFramePrompt", "videoPrompt"]
            }
          }
        },
        required: ["pageAnalysis", "globalScript", "panels"]
      }
    }
  });
  
  if (!response.text) throw new Error("Échec de l'analyse de la page.");
  return JSON.parse(response.text);
}

export async function extractCharacterBible(base64Data: string, mimeType: string, modelName: string = 'gemini-3.1-pro-preview', language: string = 'français') {
  const ai = getAI();
  
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  
  const parts: any[] = [
    { inlineData: { data: cleanBase64, mimeType } },
    { text: `Analyse ce document manga. Extrais une 'Bible des Personnages' détaillée. Pour chaque personnage récurrent ou important, donne son nom, son rôle, et une description physique TRÈS DÉTAILLÉE incluant OBLIGATOIREMENT ses couleurs (cheveux, yeux, vêtements, accessoires). Extrais aussi le style graphique global de l'oeuvre. Rédige le tout en ${language}.` }
  ];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          globalStyle: { type: Type.STRING },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                colorPalette: { type: Type.STRING }
              },
              required: ["name", "description", "colorPalette"]
            }
          }
        },
        required: ["globalStyle", "characters"]
      }
    }
  });
  
  if (!response.text) throw new Error("Échec de l'extraction de la bible des personnages.");
  return JSON.parse(response.text);
}

export async function generateAnimeFrame(sceneDescription: string, referenceImageBase64?: string, mimeType?: string, modelName: string = 'gemini-2.5-flash-image', isReferenceGeneratedFrame: boolean = false) {
  const ai = getAI();
  
  const parts: any[] = [];
  
  if (referenceImageBase64 && mimeType) {
    const base64Data = referenceImageBase64.includes(',') ? referenceImageBase64.split(',')[1] : referenceImageBase64;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    });
    
    if (isReferenceGeneratedFrame) {
      parts.push({
        text: `Use this image as a strict style, color, and character reference. Generate the next frame of the scene based on this context: ${sceneDescription}. Maintain exact character design, colors, and style. 16:9 aspect ratio, high quality, anime adaptation, masterpiece, full frame, edge-to-edge. EXTREMELY IMPORTANT: NO speech bubbles, NO text, NO words, NO manga panels, NO comic book layout, NO borders, NO letterboxing.`
      });
    } else {
      parts.push({
        text: `Colorize this manga panel, adapt to 16:9 aspect ratio, high quality, vibrant colors, anime adaptation, masterpiece, full frame, edge-to-edge. EXTREMELY IMPORTANT: NO speech bubbles, NO text, NO words, NO manga panels, NO comic book layout, NO borders, NO letterboxing. Context: ${sceneDescription}`
      });
    }
  } else {
    parts.push({
      text: `Colorized anime adaptation, high quality, vibrant colors, masterpiece, 16:9 aspect ratio, full frame, edge-to-edge. EXTREMELY IMPORTANT: NO speech bubbles, NO text, NO words, NO manga panels, NO comic book layout, NO borders, NO letterboxing. ${sceneDescription}`
    });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Aucune image générée.");
}

export async function editAnimeFrame(imageBase64: string, prompt: string, modelName: string = 'gemini-2.5-flash-image') {
  const ai = getAI();
  
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Format d'image invalide.");
  const mimeType = matches[1];
  const base64Data = matches[2];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: prompt
        }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Aucune image générée lors de la modification.");
}

export async function generateVideo(firstFrameBase64: string, lastFrameBase64: string | null, prompt: string, modelName: string = 'veo-3.1-fast-generate-preview') {
  const ai = getAI();

  const getMimeAndData = (base64Str: string) => {
    const matches = base64Str.match(/^data:(.+);base64,(.+)$/);
    return {
      mimeType: matches ? matches[1] : 'image/jpeg',
      data: matches ? matches[2] : base64Str
    };
  };

  const first = getMimeAndData(firstFrameBase64);
  
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: '16:9'
  };

  if (lastFrameBase64) {
    const last = getMimeAndData(lastFrameBase64);
    config.lastFrame = {
      imageBytes: last.data,
      mimeType: last.mimeType
    };
  }

  let operation = await ai.models.generateVideos({
    model: modelName,
    prompt: prompt,
    image: {
      imageBytes: first.data,
      mimeType: first.mimeType,
    },
    config: config
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("La génération de la vidéo a échoué.");

  // Fetch the video using the API key to bypass authentication restrictions on the URI
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  const videoResponse = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
  });

  if (!videoResponse.ok) {
    throw new Error(`Erreur lors du téléchargement de la vidéo: ${videoResponse.statusText}`);
  }

  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
}

