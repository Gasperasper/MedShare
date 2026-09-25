const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const SECRET_KEY = 'clave_secreta_super_segura';

describe('Módulo de Registro de Donantes (API)', () => {
    
    const tokenAdmin = jwt.sign({ id: 1, rol: 'administrador' }, SECRET_KEY);
    const tokenUsuario = jwt.sign({ id: 2, rol: 'usuario' }, SECRET_KEY);

    test('1. Debe fallar (401) si no se envía token', async () => {
        const res = await request(app)
            .post('/api/donantes')
            .send({ nombre: 'Carlos Ruiz', tipoSangre: 'O+' });
        
        expect(res.statusCode).toBe(401);
        expect(res.body.mensaje).toBe('Token no proporcionado');
    });

    test('1.5. Debe fallar (403) si el token es inválido o malformado', async () => {
        const res = await request(app)
            .post('/api/donantes')
            .set('Authorization', 'Bearer token_invalido_o_falso')
            .send({ nombre: 'Carlos Ruiz', tipoSangre: 'O+' });
        
        expect(res.statusCode).toBe(403);
        expect(res.body.mensaje).toBe('Token inválido o expirado');
    });

    test('2. Debe fallar (403) si un usuario común intenta registrar', async () => {
        const res = await request(app)
            .post('/api/donantes')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({ nombre: 'Carlos Ruiz', tipoSangre: 'O+' });
        
        expect(res.statusCode).toBe(403);
    });

    test('3. Debe fallar (400) si faltan datos obligatorios (ej. tipo de sangre)', async () => {
        const res = await request(app)
            .post('/api/donantes')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ nombre: 'Carlos Ruiz' }); // Falta tipoSangre
        
        expect(res.statusCode).toBe(400);
        expect(res.body.mensaje).toBe('Faltan datos obligatorios');
    });

    test('4. Debe registrar exitosamente (201) si es administrador y envía datos correctos', async () => {
        const res = await request(app)
            .post('/api/donantes')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ nombre: 'Carlos Ruiz', tipoSangre: 'O+', telefono: '555123456' });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.mensaje).toBe('Donante registrado con éxito');
        expect(res.body.donante.nombre).toBe('Carlos Ruiz');
    });
});