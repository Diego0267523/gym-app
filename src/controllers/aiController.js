// controllers/aiController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// 🔥 Controlador para chat inteligente
exports.chatAssistant = async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta || pregunta.trim() === "") {
      return res.status(400).json({ message: "La pregunta no puede estar vacía ❌" });
    }

    const tipo = classifyQuestion(pregunta);
    const prompt = buildPrompt(tipo, pregunta);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    console.log("📥 RAW GEMINI:", result); // log completo para debug

    const respuesta = safeText(result);

    res.json({ respuesta });

  } catch (error) {
    console.log("🔥 ERROR IA CHAT:", error);

    res.status(500).json({
      message: "Error IA",
      error: error.message
    });
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