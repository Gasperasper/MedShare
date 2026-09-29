const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const helmet = require('helmet');

const JWT_SECRET = process.env.JWT_SECRET || 'medshare-dev-secret'; // en producción define JWT_SECRET
const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'upgrade-insecure-requests': null // evita problemas al probar en http://localhost
        }
    }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const dbFile = process.env.NODE_ENV === 'test' ? ':memory:' : './database.sqlite';
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) console.error('Error al conectar con la base de datos:', err.message);
});

// Versiones con promesas de run/get/all
const run = (sql, p = []) => new Promise((ok, no) => db.run(sql, p, function (e) { e ? no(e) : ok(this); }));
const get = (sql, p = []) => new Promise((ok, no) => db.get(sql, p, (e, r) => (e ? no(e) : ok(r))));
const all = (sql, p = []) => new Promise((ok, no) => db.all(sql, p, (e, r) => (e ? no(e) : ok(r))));
const h = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ error: e.message }));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, rol TEXT NOT NULL DEFAULT 'usuario')`);
    db.run(`CREATE TABLE IF NOT EXISTS insumos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, nombreInsumo TEXT NOT NULL, cantidad INTEGER NOT NULL,
        categoria TEXT NOT NULL, fechaCaducidad TEXT NOT NULL,
        UNIQUE (nombreInsumo COLLATE NOCASE, categoria, fechaCaducidad))`);
});

// Crea el administrador inicial (cambia estas credenciales con variables de entorno)
if (process.env.NODE_ENV !== 'test') {
    (async () => {
        const email = (process.env.ADMIN_EMAIL || 'admin@medshare.com').toLowerCase();
        if (await get('SELECT id FROM users WHERE email = ?', [email])) return;
        const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        await run(`INSERT INTO users (nombre, email, password, rol) VALUES ('Administrador', ?, ?, 'admin')`, [email, hash]);
        console.log(`Administrador creado: ${email}`);
    })().catch((e) => console.error(e.message));
}

// ---- Middlewares ----
function auth(req, res, next) {
    try {
        req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Sesión inválida o expirada' });
    }
}
const soloAdmin = (req, res, next) =>
    req.user.rol === 'admin' ? next() : res.status(403).json({ error: 'Solo el administrador puede hacer esto' });

// ---- Autenticación ----
app.post('/api/auth/register', h(async (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password || password.length < 6)
        return res.status(400).json({ error: 'Nombre, correo y contraseña (mínimo 6 caracteres) son obligatorios' });
    const correo = email.trim().toLowerCase();
    if (await get('SELECT id FROM users WHERE email = ?', [correo]))
        return res.status(409).json({ error: 'Ese correo ya está registrado' });
    await run('INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)', [nombre.trim(), correo, await bcrypt.hash(password, 10)]);
    res.status(201).json({ mensaje: 'Cuenta creada' }); // el rol siempre es "usuario"
}));

app.post('/api/auth/login', h(async (req, res) => {
    const { email, password } = req.body;
    const u = email && password && await get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!u || !(await bcrypt.compare(password, u.password)))
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    const user = { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol };
    res.json({ token: jwt.sign(user, JWT_SECRET, { expiresIn: '8h' }), user });
}));

// ---- Insumos ----
app.get('/api/insumos', auth, h(async (req, res) => res.json(await all('SELECT * FROM insumos'))));

app.post('/api/insumos', auth, h(async (req, res) => {
    const { nombreInsumo, categoria, cantidad } = req.body;
    const fechaCaducidad = req.body.fechaCaducidad || '';   // '' = sin caducidad
    const sinCaducidad = categoria === 'Equipo médico';
    if (!nombreInsumo || !nombreInsumo.trim() || !categoria || cantidad === undefined || (!sinCaducidad && !fechaCaducidad))
        return res.status(400).json({ error: 'Faltan datos obligatorios del insumo médico' });
    const cant = Number(cantidad);
    if (!Number.isInteger(cant) || cant < 1)
        return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a 0' });
    if (fechaCaducidad && (!/^\d{4}-\d{2}-\d{2}$/.test(fechaCaducidad) || fechaCaducidad < new Date().toISOString().slice(0, 10)))
        return res.status(400).json({ error: 'La fecha de caducidad es inválida o ya pasó' });

    const nombre = nombreInsumo.trim();
    const existe = await get(
        'SELECT * FROM insumos WHERE nombreInsumo = ? COLLATE NOCASE AND categoria = ? AND fechaCaducidad = ?',
        [nombre, categoria, fechaCaducidad]);
    if (existe) { // mismo insumo, categoría y caducidad: se suma en vez de duplicar
        const total = existe.cantidad + cant;
        await run('UPDATE insumos SET cantidad = ? WHERE id = ?', [total, existe.id]);
        return res.status(200).json({
            mensaje: `Ese insumo ya existía: se sumaron ${cant} unidades (total: ${total})`,
            insumo: { ...existe, cantidad: total }
        });
    }
    const r = await run('INSERT INTO insumos (nombreInsumo, cantidad, categoria, fechaCaducidad) VALUES (?, ?, ?, ?)',
        [nombre, cant, categoria, fechaCaducidad]);
    res.status(201).json({
        mensaje: 'Insumo médico registrado con éxito en MedShare',
        insumo: { id: r.lastID, nombreInsumo: nombre, cantidad: cant, categoria, fechaCaducidad }
    });
}));

app.delete('/api/insumos/:id', auth, soloAdmin, h(async (req, res) => {
    const r = await run('DELETE FROM insumos WHERE id = ?', [req.params.id]);
    if (!r.changes) return res.status(404).json({ error: 'Insumo no encontrado' });
    res.json({ mensaje: 'Insumo dado de baja' });
}));

app.patch('/api/insumos/:id/cantidad', auth, soloAdmin, h(async (req, res) => {
    const { cantidad } = req.body;
    if (!Number.isInteger(cantidad) || cantidad < 0)
        return res.status(400).json({ error: 'La cantidad debe ser un número entero de 0 o más' });
    const r = await run('UPDATE insumos SET cantidad = ? WHERE id = ?', [cantidad, req.params.id]);
    if (!r.changes) return res.status(404).json({ error: 'Insumo no encontrado' });
    res.json({ mensaje: 'Cantidad actualizada', cantidad });
}));

app.db = db; // para que las pruebas puedan promover un usuario a admin
module.exports = app;