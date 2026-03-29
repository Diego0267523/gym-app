const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const verifyToken = require("../middlewares/authMiddleware");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const { createFoodEntrySchema, validate } = require("../middlewares/validation");
const axios = require("axios");
const FormData = require("form-data");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔥 Configurar storages
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gym-app",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});
const memoryStorage = multer.memoryStorage();
const uploadCloudinary = multer({ storage: cloudinaryStorage });
const uploadMemory = multer({ storage: memoryStorage });

// ==========================
// 🍽️ FOOD ENTRIES
// ==========================

// Crear entrada de comida (con imagen opcional) - usa Cloudinary para almacenamiento permanente
router.post("/entries", verifyToken, uploadCloudinary.single("image"), foodController.createFoodEntry);

// Obtener entradas de comida del día
router.get("/entries", verifyToken, foodController.getFoodEntries);

// Obtener totales diarios
router.get("/totals", verifyToken, foodController.getDailyTotals);

// Obtener totales de la semana
router.get("/weekly-totals", verifyToken, foodController.getWeeklyTotals);

// Eliminar entrada de comida
router.delete("/entries/:id", verifyToken, foodController.deleteFoodEntry);

// ==========================
// 🧪 ENDPOINT DE PRUEBA SIN DB
// ==========================
router.get("/test", (req, res) => {
  res.json({ success: true, message: "API funcionando", timestamp: new Date().toISOString() });
});

// ==========================
// 🤖 ANÁLISIS DE ALIMENTOS CON LOGMEAL (INTEGRACIÓN COMPLETA)
// ==========================
router.post("/ai/calories", uploadMemory.single("image"), async (req, res) => {
  try {
    console.log("🔍 Recibida petición a /ai/calories");
    const text = req.body.text || "";
    const imageFile = req.file?.buffer;

    console.log("📝 Texto:", text);
    console.log("🖼️ Imagen:", !!imageFile);

    if (!imageFile && !text) {
      return res.status(400).json({
        success: false,
        message: "Debes enviar imagen o descripción"
      });
    }

    // 🔥 Si hay imagen, usar integración completa con LogMeal
    if (imageFile) {
      console.log("📡 Paso 1: Enviando imagen a LogMeal para segmentación...");

      // PASO 1: Segmentación y reconocimiento
      const formData = new FormData();
      formData.append("image", imageFile, "food.jpg");
      formData.append("language", "spa");

      const segmentationResponse = await axios.post(
        "https://api.logmeal.com/v2/image/segmentation/complete",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
          },
        }
      );

      const segmentationData = segmentationResponse.data;
      console.log("✅ Segmentación completada. ImageId:", segmentationData.imageId);

      // PASO 2: Obtener información nutricional usando el imageId
      console.log("📡 Paso 2: Obteniendo información nutricional...");

      const nutritionResponse = await axios.post(
        "https://api.logmeal.com/v2/nutrition/recipe/nutritionalInfo",
        {
          imageId: segmentationData.imageId,
          language: "spa"
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
          },
        }
      );

      const nutritionData = nutritionResponse.data;
      console.log("✅ Información nutricional obtenida");

      // 🔥 Procesar múltiples alimentos detectados
      const segmentationResults = segmentationData.segmentation_results || [];
      const nutritionalInfoPerItem = nutritionData.nutritional_info_per_item || [];

      console.log(`📊 Detectados ${segmentationResults.length} alimentos en la imagen`);

      // 🔥 Crear lista de alimentos con su información nutricional
      const detectedFoods = [];

      for (let i = 0; i < segmentationResults.length; i++) {
        const segment = segmentationResults[i];
        const recognition = segment.recognition_results?.[0]; // Tomar el más probable

        if (!recognition) continue;

        // 🔥 Buscar información nutricional específica para este segmento
        const nutritionForItem = nutritionalInfoPerItem.find(
          item => item.food_item_position === segment.food_item_position
        );

        let nutrition;
        if (nutritionForItem && nutritionForItem.hasNutritionalInfo) {
          // Información nutricional específica del segmento
          const nutriInfo = nutritionForItem.nutritional_info || {};
          nutrition = {
            calories: Math.round(nutriInfo.calories || 0),
            proteina: Math.round(nutriInfo.protein?.value || 0),
            carbohidratos: Math.round(nutriInfo.carbs?.value || 0),
            grasas: Math.round(nutriInfo.fat?.value || 0),
            fibra: Math.round(nutriInfo.fiber?.value || 0),
            sodio: Math.round(nutriInfo.sodium?.value || 0)
          };
        } else {
          // Fallback a estimaciones basadas en el tamaño de porción
          const servingSize = segment.serving_size || 0;
          nutrition = {
            calories: Math.round(servingSize * 1.5),
            proteina: Math.round(servingSize * 0.25),
            carbohidratos: Math.round(servingSize * 0.3),
            grasas: Math.round(servingSize * 0.2),
            fibra: 0,
            sodio: 0
          };
        }

        detectedFoods.push({
          name: recognition.name,
          confidence: recognition.prob || 0,
          serving_size: segment.serving_size || 0,
          nutrition: nutrition,
          position: segment.food_item_position
        });
      }

      // 🔥 Calcular totales nutricionales combinados
      const totalNutrition = detectedFoods.reduce((total, food) => {
        return {
          calories: total.calories + food.nutrition.calories,
          proteina: total.proteina + food.nutrition.proteina,
          carbohidratos: total.carbohidratos + food.nutrition.carbohidratos,
          grasas: total.grasas + food.nutrition.grasas,
          fibra: total.fibra + food.nutrition.fibra,
          sodio: total.sodio + food.nutrition.sodio
        };
      }, { calories: 0, proteina: 0, carbohidratos: 0, grasas: 0, fibra: 0, sodio: 0 });

      return res.json({
        success: true,
        detected_foods: detectedFoods,
        total_nutrition: totalNutrition,
        summary: detectedFoods.map(food => `${food.name}: ${food.nutrition.calories} cal`).join(', '),
        details: {
          total_foods: detectedFoods.length,
          logmeal_segmentation: segmentationData,
          logmeal_nutrition: nutritionData,
          note: nutritionalInfoPerItem.length > 0
            ? "Información nutricional detallada por alimento obtenida de LogMeal"
            : "Información nutricional estimada (LogMeal no proporcionó datos detallados por alimento)"
        }
      });
    } else {
      // 🔥 Para texto solo, usar respuesta mock
      console.log("📝 Usando respuesta mock para texto (LogMeal requiere imagen)");
      const mockNutrition = {
        calories: 350,
        proteina: 25,
        carbohidratos: 45,
        grasas: 15,
        fibra: 3,
        sodio: 500
      };

      return res.json({
        success: true,
        food: {
          name: text,
          confidence: 0.8,
          serving_size: 200
        },
        nutrition: mockNutrition,
        details: {
          note: "Análisis basado en texto. Para análisis preciso con datos reales, envía imagen."
        }
      });
    }

  } catch (error) {
    console.error("❌ Error en integración completa:", error.response?.data || error.message);

    // 🔥 Manejar errores específicos de LogMeal
    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        message: "Error de autenticación con LogMeal API",
        error: "API key inválida o expirada"
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Límite de llamadas excedido en LogMeal API",
        error: "Demasiadas peticiones"
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: "Plan de LogMeal insuficiente",
        error: "Se requiere plan premium para información nutricional"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error analizando la comida",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;