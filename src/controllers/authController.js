const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// ==========================
// 🔥 REGISTER PRO (FIX REAL)
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
    const existingUser = await new Promise((resolve, reject) => {
      userModel.findUserByEmail(email, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El usuario ya existe"
      });
    }

    // 🔐 HASH
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 CREAR USUARIO
    const result = await new Promise((resolve, reject) => {
      userModel.createUser(
        { nombre, email, password: hashedPassword },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    const userId = result.insertId;

    // ==========================
    // 🔥 GUARDAR DATOS
    // ==========================
    await Promise.all([

      // 📏 MEDIDAS
      (async () => {
        if (!peso && !altura) return;

        await new Promise((resolve, reject) => {
          userModel.saveMeasurements(
            userId,
            { peso: peso || null, altura: altura || null },
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });
      })(),

      // 🎯 PERFIL FITNESS
      (async () => {
        await new Promise((resolve, reject) => {
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
              if (err) return reject(err);
              resolve();
            }
          );
        });
      })(),

      // 🏥 SALUD
      (async () => {
        if (!condiciones && !medicamentos && !lesiones && !restricciones) {
          return;
        }

        await new Promise((resolve, reject) => {
          userModel.saveHealth(
            userId,
            {
              condiciones,
              medicamentos,
              lesiones,
              restricciones
            },
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });
      })()

    ]);

    return res.json({
      success: true,
      message: "Usuario registrado correctamente 🚀",
      userId
    });

  } catch (error) {
    console.error("❌ ERROR REGISTER:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el registro"
    });
  }
};