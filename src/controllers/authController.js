const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

// 👇 MUY IMPORTANTE: exports.register
exports.register = (req, res) => {
    const { nombre, email, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    userModel.createUser(
        { nombre, email, password: hashedPassword },
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Error al registrar" });
            }
            res.json({ message: "Usuario registrado correctamente" });
        }
    );
};
const jwt = require("jsonwebtoken");

// LOGIN
exports.login = (req, res) => {
    const { email, password } = req.body;

    // Buscar usuario en DB
    userModel.findUserByEmail(email, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        // Si no existe
        if (results.length === 0) {
            return res.status(400).json({ error: "Usuario no encontrado" });
        }

        const user = results[0];

        // Comparar contraseña
        const validPassword = require("bcryptjs").compareSync(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ error: "Contraseña incorrecta" });
        }

        // Crear token
        const token = jwt.sign(
            { id: user.id },
            "secreto123", // luego lo pasamos a .env
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login exitoso",
            token: token
        });
    });
};