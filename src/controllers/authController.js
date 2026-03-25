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

          // 🔥 GUARDAR TODO EN PARALELO (MEJOR PERFORMANCE)
          Promise.all([

            // 📏 MEDIDAS
            new Promise((resolve) => {
              if (!peso && !altura) return resolve();

              userModel.saveMeasurements(
                userId,
                { peso: peso || null, altura: altura || null },
                () => resolve()
              );
            }),

            // 🎯 PERFIL FITNESS
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
                () => resolve()
              );
            }),

            // 🏥 SALUD
            new Promise((resolve) => {
              userModel.saveHealth(
                userId,
                {
                  condiciones,
                  medicamentos,
                  lesiones,
                  restricciones
                },
                () => resolve()
              );
            })

          ]).then(() => {
            return res.json({
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
    return res.status(500).json({
      success: false,
      message: "Error interno"
    });
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