const express = require('express');
const path = require('path');
const app = express();

// Middleware para leer JSON en las peticiones
app.use(express.json());

// Servir automáticamente la carpeta public para la interfaz visual
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint para registrar insumos médicos (Simulación optimizada para la presentación)
app.post('/api/insumos', (req, res) => {
    const { nombreInsumo, categoria, cantidad, fechaCaducidad } = req.body;

    // Validación de negocio de campos obligatorios
    if (!nombreInsumo || !categoria || !cantidad || !fechaCaducidad) {
        return res.status(400).json({ mensaje: 'Faltan datos obligatorios del insumo médico' });
    }

    // Respuesta de éxito (Código 201: Creado)
    return res.status(201).json({
        mensaje: 'Insumo médico registrado con éxito en MedShare',
        registradoPor: 'administrador',
        insumo: {
            nombreInsumo,
            categoria,
            cantidad,
            fechaCaducidad
        }
    });
});

// Exportamos app para las pruebas con Supertest (si usas un archivo server.js separado para arrancar)
module.exports = app;

// Si ejecutas directamente este archivo, arranca el servidor en el puerto 3000
if (require.main === module) {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Servidor de MedShare corriendo en http://localhost:${PORT}`);
    });
}