const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// ==========================
// 🔥 REGISTER PRO (MEJORADO)
// ==========================
exports.register = async (req, res) => {
  try {
    const {
      nombre, email, password,
      peso, altura,
      genero, objetivo, frecuencia,
      nivelActividad, tiempoObjetivo,
      condiciones, medicamentos,
      lesiones, restricciones,
      profesion, sueno
    } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email y contraseña son obligatorios"
      });
    }

    userModel.findUserByEmail(email, async (err, results) => {
      if (err) return res.status(500).json({ success: false });

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: "El usuario ya existe"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      userModel.createUser(
        { nombre, email, password: hashedPassword },
        (err, result) => {
          if (err) return res.status(500).json({ success: false });

          const userId = result.insertId;

          // 🔥 GUARDAR DATOS ADICIONALES (OPCIONALES)
          const saveAdditionalData = async () => {
            const promises = [];

            // 📏 MEDIDAS (opcional)
            if (peso || altura) {
              promises.push(
                new Promise((resolve) => {
                  userModel.saveMeasurements(
                    userId,
                    { peso: peso || null, altura: altura || null },
                    (err) => {
                      if (err) console.warn("⚠️ Error guardando medidas:", err.message);
                      resolve(); // No fallar por esto
                    }
                  );
                })
              );
            }

            // 🎯 PERFIL (opcional)
            if (genero || objetivo || frecuencia || nivelActividad || tiempoObjetivo || profesion || sueno) {
              promises.push(
                new Promise((resolve) => {
                  userModel.saveProfile(
                    userId,
                    {
                      genero,
                      objetivo,
                      frecuencia,
                      nivelActividad,
                      tiempoObjetivo,
                      profesion,
                      sueno
                    },
                    (err) => {
                      if (err) console.warn("⚠️ Error guardando perfil:", err.message);
                      resolve(); // No fallar por esto
                    }
                  );
                })
              );
            }

            // 🏥 SALUD (opcional)
            if (condiciones || medicamentos || lesiones || restricciones) {
              promises.push(
                new Promise((resolve) => {
                  userModel.saveHealth(
                    userId,
                    {
                      condiciones,
                      medicamentos,
                      lesiones,
                      restricciones
                    },
                    (err) => {
                      if (err) console.warn("⚠️ Error guardando salud:", err.message);
                      resolve(); // No fallar por esto
                    }
                  );
                })
              );
            }

            // Ejecutar todas las promesas pero no fallar si alguna falla
            try {
              await Promise.allSettled(promises);
              console.log("✅ Datos adicionales guardados (o intentados)");
            } catch (error) {
              console.warn("⚠️ Algunos datos adicionales no se guardaron:", error.message);
            }
          };

          // Ejecutar guardado de datos adicionales
          saveAdditionalData().then(() => {
            res.json({
              success: true,
              message: "Usuario registrado correctamente 🚀",
              userId
            });
          }).catch((error) => {
            console.warn("⚠️ Error en datos adicionales, pero usuario creado:", error.message);
            // Aún así devolver éxito porque el usuario básico se creó
            res.json({
              success: true,
              message: "Usuario registrado correctamente 🚀",
              userId
            });
          });

        }
      );
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};
// ==========================
// 🔥 LOGIN PRO (MEJORADO)
// ==========================
exports.login = (req, res) => {
  const { email, password } = req.body;

  // ✅ VALIDACIÓN
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email y contraseña obligatorios"
    });
  }

  userModel.findUserByEmail(email, async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error en servidor"
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const user = results[0];

    // 🔐 VALIDAR PASSWORD
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta"
      });
    }

    // 🔥 TOKEN (MEJORADO)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // 🔥 mejor UX
    );

    return res.json({
      success: true,
      message: "Login exitoso 🚀",
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email
      }
    });
  });
};
// ==========================
// 👤 GET PROFILE (FIX)
// ==========================
exports.getProfile = (req, res) => {
  try {
    const userId = req.user.id;

    userModel.getFullProfileById(userId, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Error en servidor"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      return res.json(results[0]); // 🔥 DIRECTO
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error interno"
    });
  }
};

// ==========================
// 📸 UPDATE AVATAR
// ==========================
exports.updateAvatar = (req, res) => {
  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "Imagen requerida" });
    }

    const avatar_url = file.secure_url || file.path || file.url;
    if (!avatar_url) {
      return res.status(500).json({ success: false, message: "Error al procesar la imagen" });
    }

    userModel.updateAvatar(userId, avatar_url, (err, result) => {
      if (err) {
        console.error("Error updating avatar:", err);
        return res.status(500).json({ success: false, message: "Error al actualizar avatar" });
      }
      return res.json({ success: true, message: "Avatar actualizado", avatar: avatar_url });
    });
  } catch (error) {
    console.error("Error in updateAvatar:", error);
    return res.status(500).json({ success: false, message: "Error al actualizar avatar" });
  }
};