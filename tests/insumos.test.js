const request = require('supertest');
const app = require('../src/app');

describe('Módulo de Registro de Insumos Médicos - MedShare', () => {
    
    test('1. Debe fallar (400) si faltan datos obligatorios del insumo', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .send({ nombreInsumo: '', cantidad: 10, categoria: '' });
        
        expect(res.statusCode).toBe(400);
        expect(res.body.mensaje).toBe('Faltan datos obligatorios del insumo médico');
    });

    test('2. Debe registrar exitosamente (201) un insumo médico con datos correctos', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .send({ 
                nombreInsumo: 'Paracetamol 500mg', 
                cantidad: 50, 
                categoria: 'Analgésicos' 
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.mensaje).toBe('Insumo médico registrado con éxito en MedShare');
        expect(res.body.insumo.nombreInsumo).toBe('Paracetamol 500mg');
    });

    test('3. Debe listar los insumos médicos registrados (200)', async () => {
        const res = await request(app).get('/api/insumos');
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length.lengthGreaterThanOrEqual ? res.body.length >= 0 : true).toBe(true);
    });

});