const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// ==========================
// 🔥 REGISTER PRO (FIX TOTAL)
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

      // 🔐 HASH
      const hashedPassword = await bcrypt.hash(password, 10);

      // 👤 CREAR USUARIO
      userModel.createUser(
        { nombre, email, password: hashedPassword },
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              success: false,
              message: "Error al registrar usuario"
            });
          }

          const userId = result.insertId;

          // 🔥 GUARDAR TODO (CON CONTROL DE ERRORES REAL)
          Promise.all([

            // 📏 MEDIDAS
            new Promise((resolve, reject) => {
              if (!peso && !altura) return resolve();

              userModel.saveMeasurements(
                userId,
                { peso: peso || null, altura: altura || null },
                (err) => {
                  if (err) {
                    console.error("❌ ERROR MEDIDAS:", err);
                    return reject(err);
                  }
                  resolve();
                }
              );
            }),

            // 🎯 PERFIL FITNESS
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
                    console.error("❌ ERROR PERFIL:", err);
                    return reject(err);
                  }
                  resolve();
                }
              );
            }),

            // 🏥 SALUD
            new Promise((resolve, reject) => {

              // 🔥 NO guardar si está vacío
              if (!condiciones && !medicamentos && !lesiones && !restricciones) {
                return resolve();
              }

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
                    console.error("❌ ERROR SALUD:", err);
                    return reject(err);
                  }
                  resolve();
                }
              );
            })

          ])
          .then(() => {
            return res.json({
              success: true,
              message: "Usuario registrado correctamente 🚀",
              userId
            });
          })
          .catch((error) => {
            console.error("❌ ERROR EN PROMISE.ALL:", error);
            return res.status(500).json({
              success: false,
              message: "Error guardando datos del usuario"
            });
          });

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