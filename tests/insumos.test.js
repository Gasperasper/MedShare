const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const SECRET_KEY = 'clave_secreta_super_segura';

describe('Módulo de Registro de Insumos Médicos - MedShare', () => {
    
    const tokenAdmin = jwt.sign({ id: 1, rol: 'administrador' }, SECRET_KEY);
    const tokenBeneficiario = jwt.sign({ id: 2, rol: 'beneficiario' }, SECRET_KEY);

    test('1. Debe fallar (401) si no se envía token', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .send({ nombreInsumo: 'Paracetamol 500mg', categoria: 'Medicamentos', cantidad: 10, fechaCaducidad: '2027-12-31' });
        
        expect(res.statusCode).toBe(401);
        expect(res.body.mensaje).toBe('Token no proporcionado');
    });

    test('1.5. Debe fallar (403) si el token es inválido o malformado', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .set('Authorization', 'Bearer token_falso')
            .send({ nombreInsumo: 'Paracetamol 500mg', categoria: 'Medicamentos', cantidad: 10, fechaCaducidad: '2027-12-31' });
        
        expect(res.statusCode).toBe(403);
        expect(res.body.mensaje).toBe('Token inválido o expirado');
    });

    test('2. Debe fallar (403) si un rol no autorizado intenta registrar', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .set('Authorization', `Bearer ${tokenBeneficiario}`)
            .send({ nombreInsumo: 'Paracetamol 500mg', categoria: 'Medicamentos', cantidad: 10, fechaCaducidad: '2027-12-31' });
        
        expect(res.statusCode).toBe(403);
    });

    test('3. Debe fallar (400) si faltan datos obligatorios del insumo', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ nombreInsumo: 'Paracetamol 500mg' }); // Faltan categoría, cantidad y fecha
        
        expect(res.statusCode).toBe(400);
        expect(res.body.mensaje).toBe('Faltan datos obligatorios del insumo médico');
    });

    test('4. Debe registrar exitosamente (201) un insumo médico con datos correctos', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ 
                nombreInsumo: 'Silla de ruedas plegable', 
                categoria: 'Equipo médico', 
                cantidad: 2, 
                fechaCaducidad: 'N/A' 
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.mensaje).toBe('Insumo médico registrado con éxito en MedShare');
        expect(res.body.insumo.nombreInsumo).toBe('Silla de ruedas plegable');
    });
});