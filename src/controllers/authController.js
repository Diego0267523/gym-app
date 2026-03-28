const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// ==========================
// 🔥 REGISTER PRO (MEJORADO)
// ==========================
exports.register = async (req, res) => {
  try {
    const {
      username, nombre, email, password,
      peso, altura,
      genero, objetivo, frecuencia,
      nivelActividad, tiempoObjetivo,
      condiciones, medicamentos,
      lesiones, restricciones,
      profesion, sueno
    } = req.body;

    // Aceptar tanto 'username' como 'nombre'
    const finalNombre = nombre || username;

    if (!finalNombre || !email || !password) {
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
        { nombre: finalNombre, email, password: hashedPassword },
        (err, result) => {
          if (err) return res.status(500).json({ success: false });

          const userId = result.insertId;

          // 🔥 GUARDAR DATOS ADICIONALES (OBLIGATORIOS)
          const saveAdditionalData = async () => {
            const promises = [];

            // 📏 MEDIDAS (siempre intentar guardar)
            promises.push(
              new Promise((resolve, reject) => {
                userModel.saveMeasurements(
                  userId,
                  { peso: peso || null, altura: altura || null },
                  (err) => err ? reject(new Error(`Medidas: ${err.message}`)) : resolve()
                );
              })
            );

            // 🎯 PERFIL (siempre intentar guardar)
            promises.push(
              new Promise((resolve, reject) => {
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
                  (err) => err ? reject(new Error(`Perfil: ${err.message}`)) : resolve()
                );
              })
            );

            // 🏥 SALUD (siempre intentar guardar)
            promises.push(
              new Promise((resolve, reject) => {
                userModel.saveHealth(
                  userId,
                  {
                    condiciones,
                    medicamentos,
                    lesiones,
                    restricciones
                  },
                  (err) => err ? reject(new Error(`Salud: ${err.message}`)) : resolve()
                );
              })
            );

            // Ejecutar todas las promesas - TODAS deben tener éxito
            await Promise.all(promises);
            console.log("✅ Todos los datos adicionales guardados correctamente");
          };

          // Ejecutar guardado de datos adicionales
          saveAdditionalData().then(() => {
            res.json({
              success: true,
              message: "Usuario registrado correctamente con todos los datos 🚀",
              userId
            });
          }).catch((error) => {
            console.error("❌ Error guardando datos adicionales:", error.message);

            // Si fallan los datos adicionales, ELIMINAR el usuario creado
            userModel.deleteUserById(userId, (deleteErr) => {
              if (deleteErr) {
                console.error("❌ Error eliminando usuario fallido:", deleteErr);
              } else {
                console.log("✅ Usuario fallido eliminado");
              }
            });

            res.status(500).json({
              success: false,
              message: `Error guardando datos del perfil: ${error.message}`
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
    const userId = req.user?.id;

    if (!userId) {
      console.error("Error en profile: req.user no definido");
      return res.status(401).json({ message: "No autenticado" });
    }

    userModel.getFullProfileById(userId, (err, results) => {
      if (err) {
        console.error("Error en profile DB:", err);
        return res.status(500).json({
          success: false,
          message: "Error en servidor"
        });
      }

      if (results.length === 0) {
        console.error("Error en profile: usuario no encontrado, userId:", userId);
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      return res.json(results[0]); // 🔥 DIRECTO
    });

  } catch (error) {
    console.error("Error en profile catch:", error);
    return res.status(500).json({
      success: false,
      message: "Error en servidor"
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