const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// ==========================
// 🔥 REGISTER PRO
// ==========================
exports.register = (req, res) => {
    const { nombre, email, password, peso, altura } = req.body;

    // ✅ VALIDACIÓN
    if (!nombre || !email || !password) {
        return res.status(400).json({
            message: "Todos los campos son obligatorios"
        });
    }

    // 🔍 VERIFICAR SI YA EXISTE
    userModel.findUserByEmail(email, async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error en el servidor"
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                message: "El usuario ya existe"
            });
        }

        try {
            // 🔐 HASH PASSWORD
            const hashedPassword = await bcrypt.hash(password, 10);

            // 👤 CREAR USUARIO
            userModel.createUser(
                { nombre, email, password: hashedPassword },
                (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            message: "Error al registrar"
                        });
                    }

                    const userId = result.insertId;

                    // 🔥 GUARDAR MEDIDAS (SI EXISTEN)
                    if (peso || altura) {
                        userModel.saveMeasurements(
                            userId,
                            {
                                peso: peso || null,
                                altura: altura || null
                            },
                            (err) => {
                                if (err) {
                                    console.log("Error guardando medidas:", err);
                                }
                            }
                        );
                    }

                    return res.json({
                        message: "Usuario registrado correctamente ✅",
                        userId
                    });
                }
            );

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Error en el servidor"
            });
        }
    });
};


// ==========================
// 🔥 LOGIN PRO
// ==========================
exports.login = (req, res) => {
    const { email, password } = req.body;

    // ✅ VALIDACIÓN
    if (!email || !password) {
        return res.status(400).json({
            message: "Email y contraseña son obligatorios"
        });
    }

    userModel.findUserByEmail(email, async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error en el servidor"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Usuario no encontrado"
            });
        }

        const user = results[0];

        // 🔐 VALIDAR PASSWORD
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Contraseña incorrecta"
            });
        }

        // 🔥 TOKEN
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({
            message: "Login exitoso ✅",
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });
    });
};