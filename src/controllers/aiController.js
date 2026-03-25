const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🧠 FUNCIÓN AUXILIAR PARA LIMPIAR RESPUESTA
const safeText = (result) => {
  try {
    const text = result?.response?.text();
    if (!text || text.trim() === "") {
      return null;
    }
    return text.trim();
  } catch (err) {
    console.log("❌ Error leyendo respuesta IA:", err);
    return null;
  }
};

// 🔥 GENERAR RUTINA
exports.generateRoutine = async (req, res) => {
  try {
    const { objetivo } = req.body;

    if (!objetivo) {
      return res.status(400).json({
        message: "Debes enviar un objetivo ⚠️"
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
Eres un entrenador personal profesional experto en gimnasio.

Crea una rutina basada en este objetivo: ${objetivo}

Reglas:
- Respuesta corta y práctica
- Incluye ejercicios, series y repeticiones
- Formato claro (tipo lista)
- Nada de texto innecesario
- Que se pueda hacer en un gym real

Ejemplo de formato:
- Ejercicio: series x reps
`;

    console.log("📤 OBJETIVO:", objetivo);

    const result = await model.generateContent(prompt);
    const rutina = safeText(result);

    if (!rutina) {
      console.warn("⚠️ IA devolvió vacío");
      return res.status(500).json({
        message: "La IA no generó rutina 🤖"
      });
    }

    res.json({ rutina });

  } catch (error) {
    console.log("🔥 ERROR GEMINI RUTINA:", error);

    res.status(500).json({
      message: "Error IA",
      error: error.message
    });
  }
};


// 🤖 CHAT INTELIGENTE FITNESS
exports.chatAssistant = async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({
        message: "Debes enviar una pregunta ⚠️"
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
Eres un entrenador personal profesional experto en:
- gimnasio
- pérdida de grasa
- ganancia muscular
- nutrición básica

Contexto:
La persona probablemente está en el gym ahora mismo.

Reglas:
- Responde SIEMPRE en español
- Sé claro, directo y práctico
- No te extiendas demasiado
- Da consejos aplicables en ese momento
- Si preguntan sobre bajar peso, da tiempos REALISTAS
- Explica brevemente el por qué
- Usa listas si ayuda
- Nunca dejes la respuesta vacía
- Si la pregunta es general, da una recomendación útil igualmente

Ejemplos:
Pregunta: ¿cuánto demoro en bajar 4 kilos?
Respuesta:
Bajar 4 kg puede tomar entre 4 y 8 semanas.
- Déficit calórico moderado
- Entrena 4-5 veces por semana
- Prioriza proteína
- Duerme bien

Pregunta del usuario:
${pregunta}
`;

    console.log("📤 PREGUNTA:", pregunta);

    const result = await model.generateContent(prompt);
    const respuesta = safeText(result);

    console.log("📥 RESPUESTA IA:", respuesta);

    if (!respuesta) {
      console.warn("⚠️ IA devolvió vacío");

      return res.json({
        respuesta: "No tengo una respuesta clara ahora mismo 🤔 intenta reformular la pregunta."
      });
    }

    res.json({ respuesta });

  } catch (error) {
    console.log("🔥 ERROR IA CHAT:", error);

    res.status(500).json({
      message: "Error IA",
      error: error.message
    });
  }
};