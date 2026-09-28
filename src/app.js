const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configuración de la base de datos SQLite (en memoria para tests, archivo local para producción)
const dbFile = process.env.NODE_ENV === 'test' ? ':memory:' : './database.sqlite';
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear la tabla de insumos si no existe (adaptada a los nombres del test)
db.run(`CREATE TABLE IF NOT EXISTS insumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombreInsumo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    categoria TEXT NOT NULL
)`);

// Endpoint GET: Obtener todos los insumos
app.get('/api/insumos', (req, res) => {
    db.all(`SELECT * FROM insumos`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Endpoint POST: Registrar un nuevo insumo (coincidiendo con las expectativas del test)
app.post('/api/insumos', (req, res) => {
    const { nombreInsumo, cantidad, categoria } = req.body;

    // Validación básica que espera el test
    if (!nombreInsumo || cantidad === undefined || !categoria) {
        return res.status(400).json({ mensaje: 'Faltan datos obligatorios del insumo médico' });
    }

    const query = `INSERT INTO insumos (nombreInsumo, cantidad, categoria) VALUES (?, ?, ?)`;
    db.run(query, [nombreInsumo, cantidad, categoria], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            mensaje: 'Insumo médico registrado con éxito en MedShare',
            insumo: {
                id: this.lastID,
                nombreInsumo,
                cantidad,
                categoria
            }
        });
    });
});

// Exportar app para Jest (importante para que las pruebas no levanten el puerto duplicado)
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}

module.exports = app;