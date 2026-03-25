const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateRoutine = async (req, res) => {
  try {
    const { objetivo } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `Eres un entrenador profesional.
    Dame consejos para alcanzar mi objetivo: ${objetivo}.
    Incluye ejercicios, series y repeticiones o recomendaciones para lograrlo.
    no te extiendas demasiado, quiero una respuesta corta y práctica.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({
      rutina: response
    });

  } catch (error) {
    console.log("🔥 ERROR GEMINI:", error);

    res.status(500).json({
      message: "Error IA",
      error: error.message
    });
  }
};
exports.chatAssistant = async (req, res) => {
  try {
    const { pregunta } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
Eres un entrenador personal experto.

Reglas:
- Sé claro y directo
- Sé amigable
- Da consejos prácticos
- Responde como si la persona está entrenando en ese momento


Pregunta: ${pregunta}
`;

    const result = await model.generateContent(prompt);
    const respuesta = result.response.text();

    res.json({
      respuesta
    });

  } catch (error) {
    console.log("🔥 ERROR IA CHAT:", error);

    res.status(500).json({
      message: "Error IA",
      error: error.message
    });
  }
};