const request = require('supertest');
const app = require('../src/app');

const fecha = (dias) => new Date(Date.now() + dias * 864e5).toISOString().slice(0, 10);
const cred = { email: 'user@test.com', password: 'secreto1' };
let tUser, tAdmin;

beforeAll(async () => {
    await request(app).post('/api/auth/register').send({ nombre: 'Usuario', ...cred });
    await request(app).post('/api/auth/register').send({ nombre: 'Admin', email: 'admin@test.com', password: 'secreto1' });
    await new Promise((ok) => app.db.run("UPDATE users SET rol='admin' WHERE email='admin@test.com'", ok));
    tUser = (await request(app).post('/api/auth/login').send(cred)).body.token;
    tAdmin = (await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'secreto1' })).body.token;
});

const post = (body, t = tUser) => request(app).post('/api/insumos').set('Authorization', 'Bearer ' + t).send(body);
const base = { nombreInsumo: 'Paracetamol 500mg', categoria: 'Medicamentos', cantidad: 10, fechaCaducidad: fecha(60) };

describe('Autenticación', () => {
    test('registro inválido responde 400', async () => {
        expect((await request(app).post('/api/auth/register').send({ email: 'x@x.com' })).statusCode).toBe(400);
    });
    test('correo repetido responde 409', async () => {
        expect((await request(app).post('/api/auth/register').send({ nombre: 'Otro', ...cred })).statusCode).toBe(409);
    });
    test('contraseña incorrecta responde 401', async () => {
        expect((await request(app).post('/api/auth/login').send({ ...cred, password: 'mala' })).statusCode).toBe(401);
    });
    test('login correcto devuelve token y rol', async () => {
        const res = await request(app).post('/api/auth/login').send(cred);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.rol).toBe('usuario');
    });
    test('sin token o con token falso responde 401', async () => {
        expect((await request(app).get('/api/insumos')).statusCode).toBe(401);
        expect((await post(base, 'falso')).statusCode).toBe(401);
    });
});

describe('Insumos', () => {
    test('faltan datos → 400', async () => {
        expect((await post({ ...base, nombreInsumo: '' })).statusCode).toBe(400);
    });
    test('cantidad inválida → 400', async () => {
        expect((await post({ ...base, cantidad: 0 })).statusCode).toBe(400);
    });
    test('fecha vencida → 400', async () => {
        expect((await post({ ...base, fechaCaducidad: fecha(-1) })).statusCode).toBe(400);
    });
    test('registro correcto → 201', async () => {
        const res = await post(base);
        expect(res.statusCode).toBe(201);
        expect(res.body.insumo.nombreInsumo).toBe('Paracetamol 500mg');
    });
    test('insumo repetido suma la cantidad (200) sin duplicar', async () => {
        const res = await post({ ...base, nombreInsumo: 'paracetamol 500MG', cantidad: 5 });
        expect(res.statusCode).toBe(200);
        expect(res.body.insumo.cantidad).toBe(15);
        const lista = await request(app).get('/api/insumos').set('Authorization', 'Bearer ' + tUser);
        expect(lista.body.filter((i) => i.nombreInsumo.toLowerCase().startsWith('paracetamol'))).toHaveLength(1);
    });
    test('otra fecha de caducidad crea un registro aparte', async () => {
        expect((await post({ ...base, fechaCaducidad: fecha(90) })).statusCode).toBe(201);
    });
});

describe('Roles (baja de insumos)', () => {
    test('usuario normal → 403', async () => {
        const res = await request(app).delete('/api/insumos/1').set('Authorization', 'Bearer ' + tUser);
        expect(res.statusCode).toBe(403);
    });
    test('admin da de baja → 200 y luego 404', async () => {
        const del = () => request(app).delete('/api/insumos/1').set('Authorization', 'Bearer ' + tAdmin);
        expect((await del()).statusCode).toBe(200);
        expect((await del()).statusCode).toBe(404);
    });
});

describe('Equipo sin caducidad y edición de cantidad', () => {
    const silla = { nombreInsumo: 'Silla de ruedas', categoria: 'Equipo médico', cantidad: 2 };
    const conToken = (t) => ({ Authorization: 'Bearer ' + t });

    test('equipo médico se registra sin fecha (201) y se suma si se repite', async () => {
        expect((await post(silla)).statusCode).toBe(201);
        const res = await post(silla);
        expect(res.statusCode).toBe(200);
        expect(res.body.insumo.cantidad).toBe(4);
    });
    test('equipo médico con fecha vencida sigue dando 400', async () => {
        expect((await post({ ...silla, fechaCaducidad: fecha(-1) })).statusCode).toBe(400);
    });
    test('usuario normal no puede editar cantidad (403)', async () => {
        const res = await request(app).patch('/api/insumos/2/cantidad').set(conToken(tUser)).send({ cantidad: 1 });
        expect(res.statusCode).toBe(403);
    });
    test('admin edita la cantidad (200)', async () => {
        const lista = await request(app).get('/api/insumos').set(conToken(tAdmin));
        const id = lista.body.find((i) => i.nombreInsumo === 'Silla de ruedas').id;
        const res = await request(app).patch(`/api/insumos/${id}/cantidad`).set(conToken(tAdmin)).send({ cantidad: 1 });
        expect(res.statusCode).toBe(200);
        expect(res.body.cantidad).toBe(1);
    });
    test('cantidad inválida → 400 e insumo inexistente → 404', async () => {
        const patch = (id, cantidad) => request(app).patch(`/api/insumos/${id}/cantidad`).set(conToken(tAdmin)).send({ cantidad });
        expect((await patch(2, -3)).statusCode).toBe(400);
        expect((await patch(2, 'abc')).statusCode).toBe(400);
        expect((await patch(9999, 5)).statusCode).toBe(404);
    });
});