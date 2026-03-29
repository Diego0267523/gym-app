router.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Imagen requerida" });

    // 1️⃣ Segmentación
    const segmentResp = await axios.post(
      `${LOGMEAL_BASE}/imagen/segmentación/completa`,
      file.buffer,
      {
        headers: {
          ...logmealHeaders,
          "Content-Type": "application/octet-stream"
        }
      }
    );
    const imageId = segmentResp.data.imageId;
    if (!imageId) throw new Error("No se obtuvo imageId");

    // 2️⃣ Confirmación de platos (auto-confirmar todos)
    const dishesToConfirm = segmentResp.data.dishes?.map(d => d.dishId) || [];
    await axios.post(
      `${LOGMEAL_BASE}/imagen/confirmar/tipo`,
      { imageId, confirmedDishes: dishesToConfirm },
      { headers: logmealHeaders }
    );

    // 3️⃣ Obtener cantidades y nutrición
    const quantityResp = await axios.post(
      `${LOGMEAL_BASE}/imagen/segmentación/completa/cantidad`,
      { imageId },
      { headers: logmealHeaders }
    );

    // 4️⃣ Extraer datos principales
    const aiJson = quantityResp.data.aiJson || null;
    const total = aiJson?.total || {};
    const responsePayload = {
      calories: total.calorias || 0,
      proteina: total.proteina || 0,
      carbohidratos: total.carbohidratos || 0,
      details: { aiJson }
    };

    res.json({ success: true, ...responsePayload });

  } catch (error) {
    console.error("Error LogMeal analizar imagen:", error.response?.data || error.message);
    res.status(500).json({ message: "No se pudo analizar la imagen" });
  }
});

export default router;