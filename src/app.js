const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const SECRET_KEY = 'clave_secreta_super_segura';

// Middleware de autenticación por JWT y verificación de roles
function verificarRol(rolRequerido) {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            req.user = decoded;

            if (req.user.rol !== rolRequerido) {
                return res.status(403).json({ mensaje: 'Acceso denegado: Rol insuficiente' });
            }
            next();
        } catch (err) {
            return res.status(403).json({ mensaje: 'Token inválido o expirado' });
        }
    };
}

// Ruta protegida: Solo administradores pueden registrar donantes
app.post('/api/donantes', verificarRol('administrador'), (req, res) => {
    const { nombre, tipoSangre, telefono } = req.body;
    
    if (!nombre || !tipoSangre) {
        return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
    }

    // Aquí iría la lógica para guardar en base de datos
    res.status(201).json({
        mensaje: 'Donante registrado con éxito',
        donante: { nombre, tipoSangre, telefono }
    });
});

module.exports = app;