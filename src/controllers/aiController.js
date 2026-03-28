// controllers/aiController.js
const axios = require("axios");
const SPOON_API_KEY = process.env.SPOONACULAR_API_KEY;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

// 🔥 CACHE SIMPLE EN MEMORIA
const nutritionCache = new Map();

// 🔥 Función para leer resultado de Gemini de forma segura
const safeText = (result) => {
  try {
    const text = result?.response?.text();
    if (!text || text.trim() === "") {
      return "No tengo una respuesta clara ahora mismo 🤔 pero te recomiendo mantener constancia y hábitos saludables 💪";
    }
    return text.trim();
  } catch (err) {
    console.log("❌ ERROR leyendo respuesta IA:", err);
    return "Hubo un problema con la IA 😢 intenta de nuevo.";
  }
};

// 🔥 Detección de tipo de pregunta
const classifyQuestion = (pregunta) => {
  const q = pregunta.toLowerCase();

  if (q.includes("rutina") || q.includes("entrenamiento") || q.includes("día de gym")) {
    return "rutina";
  }
  if (q.includes("bajar") || q.includes("perder peso") || q.includes("kilos") || q.includes("grasa")) {
    return "peso";
  }
  if (q.includes("nutrición") || q.includes("comer") || q.includes("dieta") || q.includes("calorías")) {
    return "nutricion";
  }
  return "general";
};

// 🔥 Prompt inteligente según tipo
const buildPrompt = (tipo, pregunta) => {
  switch (tipo) {
    case "rutina":
      return `
Eres un entrenador personal profesional experto en gimnasio.
Contexto: La persona está en el gym ahora mismo.
Reglas:
- Responde siempre y de forma práctica.
- Incluye ejercicios, series y repeticiones si es relevante.
- Sé directo, amigable y claro.
Pregunta: ${pregunta}
      `;
    case "peso":
      return `
Eres un entrenador personal experto en pérdida de grasa y control de peso.
Contexto: La persona está interesada en bajar de peso de forma segura.
Reglas:
- Responde siempre y da estimaciones realistas.
- Si no puedes asegurar exactitud, da un rango o consejos prácticos.
- Incluye hábitos, frecuencia de entrenamiento y recomendaciones de dieta.
Pregunta: ${pregunta}
      `;
    case "nutricion":
      return `
Eres un experto en nutrición y dietética para personas activas.
Contexto: La persona busca mejorar su alimentación.
Reglas:
- Responde siempre con consejos claros y prácticos.
- Incluye tips de comidas, horarios y macros si es relevante.
Pregunta: ${pregunta}
      `;
    default:
      return `
Eres un entrenador personal profesional experto en fitness.
Reglas:
- Responde siempre de forma clara y directa.
- Da consejos aplicables en el momento.
Pregunta: ${pregunta}
      `;
  }
};

const runChatAssistant = async (pregunta) => {
  if (!pregunta || pregunta.trim() === "") {
    throw new Error("La pregunta no puede estar vacía ❌");
  }

  const tipo = classifyQuestion(pregunta);
  const prompt = buildPrompt(tipo, pregunta);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);

  console.log("📥 RAW GEMINI:", result);

  const respuesta = safeText(result);
  return respuesta;
};

// 🔥 Controlador para chat inteligente
exports.chatAssistant = async (req, res) => {
  try {
    const { pregunta } = req.body;
    const respuesta = await runChatAssistant(pregunta);
    res.json({ respuesta });
  } catch (error) {
    console.log("🔥 ERROR IA CHAT:", error);
    if (error.message.includes("vacía")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({
      message: "Error IA",
      error: error.message
    });
  }
};

exports.runChatAssistant = runChatAssistant;

// Helper de parseo simple
const parseCaloriesFromText = (text) => {
  if (!text || !text.toString().trim()) {
    return null;
  }

  const normalized = text.toString();
  const match = normalized.match(/(\d+[\.,]?\d*)\s*(kcal|cal)/i);
  if (match) {
    const value = parseFloat(match[1].replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }

  return null;
};

const parseMacrosFromText = (text) => {
  if (!text || !text.toString().trim()) {
    return { proteina: null, carbohidratos: null };
  }

  const normalized = text.toString();
  const macros = { proteina: null, carbohidratos: null };

  const regexList = [
    { key: 'proteina', re: /(\d+[\.,]?\d*)\s*(g|gr|gramos)\s*(proteína|proteinas|protein)/i },
    { key: 'carbohidratos', re: /(\d+[\.,]?\d*)\s*(g|gr|gramos)\s*(carbohidratos|carbs|carbohidrato)/i },
  ];

  for (const item of regexList) {
    const match = normalized.match(item.re);
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'));
      if (Number.isFinite(value)) macros[item.key] = value;
    }
  }

  return macros;
};

const cleanCaloriesText = (text) => {
  if (!text || !text.trim()) return null;
  const parsed = parseCaloriesFromText(text);
  if (parsed !== null) return parsed;
  return null;
};

const parseJsonFromText = (text) => {
  if (!text || !text.toString().trim()) return null;

  // Intentar extraer primario JSON bloqueado por texto
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const cleaned = jsonMatch[0];
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    // Fallback: intentar con reemplazos simples de comillas erróneas
    try {
      const fallback = jsonMatch[0]
        .replace(/\b([a-zA-Z0-9_]+)\s*:/g, '"$1":')
        .replace(/'/g, '"');
      return JSON.parse(fallback);
    } catch (err2) {
      return null;
    }
  }
};

const parseFoodItemsFromText = (text) => {
  if (!text || !text.toString().trim()) return null;

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items = [];
  let current = null;

  const pushCurrent = () => {
    if (current && current.nombre) {
      current.calorias = Number(current.calorias || 0);
      current.proteina = Number(current.proteina || 0);
      current.carbohidratos = Number(current.carbohidratos || 0);
      items.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    const calMatch = line.match(/calor[ií]as?\s*:\s*(\d+[\.,]?\d*)/i);
    const proMatch = line.match(/prote[ií]na?\s*:\s*(\d+[\.,]?\d*)/i);
    const carbMatch = line.match(/carbohidratos?\s*:\s*(\d+[\.,]?\d*)/i);

    if (!calMatch && !proMatch && !carbMatch) {
      // Texto de nombre de alimento
      // Si ya hay current item, guardalo y comienza uno nuevo
      if (current && current.calorias !== undefined) {
        pushCurrent();
      }
      current = { nombre: line, calorias: null, proteina: null, carbohidratos: null };
      continue;
    }

    if (!current) {
      current = { nombre: 'Desconocido', calorias: null, proteina: null, carbohidratos: null };
    }

    if (calMatch) {
      current.calorias = Number(calMatch[1].replace(',', '.'));
    }
    if (proMatch) {
      current.proteina = Number(proMatch[1].replace(',', '.'));
    }
    if (carbMatch) {
      current.carbohidratos = Number(carbMatch[1].replace(',', '.'));
    }
  }

  pushCurrent();

  if (items.length === 0) return null;

  const total = items.reduce(
    (acc, item) => ({
      calorias: acc.calorias + (Number.isFinite(item.calorias) ? item.calorias : 0),
      proteina: acc.proteina + (Number.isFinite(item.proteina) ? item.proteina : 0),
      carbohidratos: acc.carbohidratos + (Number.isFinite(item.carbohidratos) ? item.carbohidratos : 0)
    }),
    { calorias: 0, proteina: 0, carbohidratos: 0 }
  );

  return { items, total };
};

const requestCaloriesByAI = async (promptMessage) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(promptMessage);
  const outputText = safeText(result);

  let aiJson = parseJsonFromText(outputText);
  let mealPlan = null;

  if (!aiJson) {
    mealPlan = parseFoodItemsFromText(outputText);
    aiJson = mealPlan;
  }

  const parsed =
    aiJson?.total?.calorias ||
    (mealPlan ? mealPlan.total.calorias : null) ||
    parseCaloriesFromText(outputText);

  const macrosFromText = parseMacrosFromText(outputText);

  const macros = {
    proteina:
      aiJson?.total?.proteina || (mealPlan ? mealPlan.total.proteina : null) || macrosFromText.proteina,
    carbohidratos:
      aiJson?.total?.carbohidratos || (mealPlan ? mealPlan.total.carbohidratos : null) || macrosFromText.carbohidratos
  };

  const items = aiJson?.items || (mealPlan ? mealPlan.items : null);

  return { outputText, parsed, macros, aiJson, items };
};
const getNutritionFromSpoonacular = async (query) => {
  try {
    const normalizedQuery = query.toLowerCase().trim();

    // 🔥 1. Revisar cache
    if (nutritionCache.has(normalizedQuery)) {
      console.log("⚡ Usando cache:", normalizedQuery);
      return nutritionCache.get(normalizedQuery);
    }

    // 🔥 2. Llamar API
    const url = `https://api.spoonacular.com/recipes/guessNutrition?title=${encodeURIComponent(query)}&apiKey=${process.env.SPOONACULAR_API_KEY}`;

    const { data } = await axios.get(url);

    const result = {
      calorias: data.calories?.value || null,
      proteina: data.protein?.value || null,
      carbohidratos: data.carbs?.value || null
    };

    // 🔥 3. Guardar en cache
    nutritionCache.set(normalizedQuery, result);

    return result;

  } catch (error) {
    console.log("❌ Spoonacular error:", error.response?.data || error.message);
    return null;
  }
};

// Nuevo endpoint: conteo de calorías por texto / imagen
exports.countCalories = async (req, res) => {
  try {
    const { text } = req.body;
    let imageUrl = req.body.imageUrl;

    console.log("[countCalories] req.file:", req.file);

    if (req.file) {
      imageUrl = req.file.secure_url || req.file.path || req.file.url;
    }

    if (!text && !imageUrl) {
      return res.status(400).json({ success: false, message: "Debes enviar text o imageUrl (o subir image)" });
    }

    let result = { success: true, calories: null, proteina: null, carbohidratos: null, source: null, details: {} };

if (text) {
  // 🔥 1. Intentar Spoonacular primero (DATOS REALES)
  const spoon = await getNutritionFromSpoonacular(text);

  if (spoon && spoon.calorias) {
    return res.json({
      success: true,
      calories: spoon.calorias,
      proteina: spoon.proteina,
      carbohidratos: spoon.carbohidratos,
      source: "spoonacular"
    });
  }

  // 🔥 2. Si Spoon falla → usar regex
  const parsed = cleanCaloriesText(text);
  if (parsed !== null) {
    result = { ...result, calories: parsed, source: "text_regex", details: { text } };
    return res.json(result);
  }

  // 🔥 3. Último recurso → IA

      const prompt = `Eres un nutricionista. Dada la siguiente descripción de comida, responde ÚNICAMENTE con JSON válido (nada más) en este formato:\n` +
        `{"items":[{"nombre":"...","calorias":number,"proteina":number,"carbohidratos":number}],"total":{"calorias":number,"proteina":number,"carbohidratos":number},"comentario":"..."}\n` +
        `Si no estás seguro, deja valor como null. Evita explicaciones adicionales. \nDescripción: ${text}`;

      const ai = await requestCaloriesByAI(prompt);
      result = {
        ...result,
        calories: ai.parsed || null,
        proteina: ai.macros?.proteina || null,
        carbohidratos: ai.macros?.carbohidratos || null,
        source: "text_ai",
        details: { text, aiText: ai.outputText, aiJson: ai.aiJson }
      };

      if (ai.aiJson?.total) {
        result.calories = ai.aiJson.total.calorias || result.calories;
        result.proteina = ai.aiJson.total.proteina || result.proteina;
        result.carbohidratos = ai.aiJson.total.carbohidratos || result.carbohidratos;
      }
    }

if (imageUrl) {
  // 🔥 1. Detectar comida con IA
  const prompt = `Describe brevemente la comida en esta imagen (solo nombre del plato): ${imageUrl}`;
  const ai = await requestCaloriesByAI(prompt);

  const detectedFood = ai.outputText;

  // 🔥 2. Consultar Spoonacular con lo detectado
  const spoon = await getNutritionFromSpoonacular(detectedFood);

  if (spoon && spoon.calorias) {
    result.calories = spoon.calorias;
    result.proteina = spoon.proteina;
    result.carbohidratos = spoon.carbohidratos;
    result.source = "image_spoonacular";
  } else {
    result.source = "image_ai_fallback";
  }

  result.details.detectedFood = detectedFood;
  result.details.imageUrl = imageUrl;
}

    // Si se tiene texto y no macros aún, intentar extraer del texto
    if (!result.proteina && text) {
      const parsedTextMacros = parseMacrosFromText(text);
      if (parsedTextMacros.proteina) result.proteina = parsedTextMacros.proteina;
      if (parsedTextMacros.carbohidratos) result.carbohidratos = parsedTextMacros.carbohidratos;
    }

    if (!result.carbohidratos && text) {
      const parsedTextMacros = parseMacrosFromText(text);
      if (parsedTextMacros.carbohidratos) result.carbohidratos = parsedTextMacros.carbohidratos;
    }

    if (!result.calories) {
      result.note = "No se pudo extraer un valor numérico exacto, revisa el campo details.aiText.";
    }

    return res.json(result);
  } catch (error) {
    console.log("🔥 ERROR IA CALORIAS:", error);
    return res.status(500).json({ message: "Error calculando calorías", error: error.message });
  }
};

// 🔥 Controlador para generar rutinas (opcional)
exports.generateRoutine = async (req, res) => {
  try {
    const { objetivo } = req.body;
    if (!objetivo || objetivo.trim() === "") {
      return res.status(400).json({ message: "El objetivo no puede estar vacío ❌" });
    }

    const prompt = `
Eres un entrenador profesional.
Dame consejos prácticos para alcanzar mi objetivo: ${objetivo}.
Incluye ejercicios, series y repeticiones si aplica.
Responde de manera corta, clara y aplicable.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    console.log("📥 RAW GEMINI RUTINA:", result);

    const rutina = safeText(result);

    res.json({ rutina });

  } catch (error) {
    console.log("🔥 ERROR GEMINI:", error);
    res.status(500).json({
      message: "Error IA",
      error: error.message
    });
  }
};