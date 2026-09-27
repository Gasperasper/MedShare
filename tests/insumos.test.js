const request = require('supertest');
const app = require('../src/app.js');

describe('Módulo de Registro de Insumos Médicos - MedShare', () => {

    test('1. Debe fallar (400) si faltan datos obligatorios del insumo', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .send({ 
                nombreInsumo: 'Paracetamol 500mg' 
                // Faltan categoría, cantidad y fecha de caducidad
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.mensaje).toBe('Faltan datos obligatorios del insumo médico');
    });

    test('2. Debe registrar exitosamente (201) un insumo médico con datos correctos', async () => {
        const res = await request(app)
            .post('/api/insumos')
            .send({
                nombreInsumo: 'Paracetamol 500mg',
                categoria: 'Medicamentos',
                cantidad: 10,
                fechaCaducidad: '2027-12-31'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.mensaje).toBe('Insumo médico registrado con éxito en MedShare');
        expect(res.body.insumo.nombreInsumo).toBe('Paracetamol 500mg');
    });

});