const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// ==========================
// 🔥 REGISTER PRO FIXED
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

    // ✅ VALIDACIÓN
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email y contraseña son obligatorios"
      });
    }

    // 🔍 VERIFICAR SI EXISTE
    userModel.findUserByEmail(email, async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Error en servidor"
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: "El usuario ya existe"
        });
      }

      // 🔐 HASH PASSWORD
      const hashedPassword = await bcrypt.hash(password, 10);

      // 👤 CREAR USUARIO
      userModel.createUser(
        { nombre, email, password: hashedPassword },
        async (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              success: false,
              message: "Error al registrar usuario"
            });
          }

          const userId = result.insertId;

          try {
            // 🔥 GUARDAR TODO CON CONTROL DE ERRORES
            await Promise.all([

              // 📏 MEDIDAS
              new Promise((resolve, reject) => {
                if (!peso && !altura) return resolve();

                userModel.saveMeasurements(
                  userId,
                  {
                    peso: peso || null,
                    altura: altura || null
                  },
                  (err) => {
                    if (err) {
                      console.error("Error en medidas:", err);
                      return reject(err);
                    }
                    resolve();
                  }
                );
              }),

              // 🎯 PERFIL
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
                  (err) => {
                    if (err) {
                      console.error("Error en perfil:", err);
                      return reject(err);
                    }
                    resolve();
                  }
                );
              }),

              // 🏥 SALUD (🔥 AQUÍ ESTABA EL BUG)
              new Promise((resolve, reject) => {
                userModel.saveHealth(
                  userId,
                  {
                    condiciones,
                    medicamentos,
                    lesiones,
                    restricciones
                  },
                  (err) => {
                    if (err) {
                      console.error("Error en salud:", err);
                      return reject(err);
                    }
                    resolve();
                  }
                );
              })

            ]);

            // ✅ TODO OK
            return res.json({
              success: true,
              message: "Usuario registrado correctamente 🚀",
              userId
            });

          } catch (error) {
            console.error("Error guardando datos:", error);
            return res.status(500).json({
              success: false,
              message: "Error al guardar datos del usuario"
            });
          }
        }
      );
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error interno"
    });
  }
};