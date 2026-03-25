const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// 🔥 REGISTER
exports.register = (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({
            message: "Todos los campos son obligatorios"
        });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    userModel.createUser(
        { nombre, email, password: hashedPassword },
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Error al registrar"
                });
            }

            return res.json({
                message: "Usuario registrado correctamente ✅"
            });
        }
    );
};


// 🔥 LOGIN
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email y contraseña son obligatorios"
        });
    }

    userModel.findUserByEmail(email, (err, results) => {
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

        const validPassword = bcrypt.compareSync(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Contraseña incorrecta"
            });
        }

        // 🔥 USANDO VARIABLE DE ENTORNO
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({
            message: "Login exitoso ✅",
            token
        });
    });
};