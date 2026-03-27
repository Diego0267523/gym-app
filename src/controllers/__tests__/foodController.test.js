const request = require('supertest');
const express = require('express');
const foodRoutes = require('../../routes/foodRoutes');
const db = require('../../config/db');

// Mock de DB
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Mock de auth middleware
jest.mock('../../middlewares/authMiddleware', () => (req, res, next) => {
  req.user = { id: 1 }; // Mock user
  next();
});

// Mock de upload middleware
jest.mock('../../middlewares/upload', () => ({
  single: () => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/food', foodRoutes);

describe('Food Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/food/entries', () => {
    test('debe crear entrada de comida exitosamente', async () => {
      db.query.mockImplementation((sql, values, callback) => {
        callback(null, { insertId: 123 });
      });

      const response = await request(app)
        .post('/api/food/entries')
        .send({
          descripcion: 'Manzana',
          calorias: 50,
          proteina: 0.5,
          carbohidratos: 12
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe(123);
    });

    test('debe rechazar entrada sin descripción ni valores', async () => {
      const response = await request(app)
        .post('/api/food/entries')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('debe manejar errores de DB', async () => {
      db.query.mockImplementation((sql, values, callback) => {
        callback(new Error('DB Error'), null);
      });

      const response = await request(app)
        .post('/api/food/entries')
        .send({ descripcion: 'Test' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/food/entries', () => {
    test('debe obtener entradas del día', async () => {
      const mockEntries = [
        { id: 1, descripcion: 'Manzana', calorias: 50, proteina: 0.5, carbohidratos: 12, created_at: '2026-03-27' }
      ];

      db.query.mockImplementation((sql, values, callback) => {
        callback(null, mockEntries);
      });

      const response = await request(app)
        .get('/api/food/entries');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.entries).toEqual(mockEntries);
    });
  });

  describe('GET /api/food/totals', () => {
    test('debe obtener totales diarios', async () => {
      const mockTotals = { total_calorias: 150, total_proteina: 5, total_carbohidratos: 20 };

      db.query.mockImplementation((sql, values, callback) => {
        callback(null, [mockTotals]);
      });

      const response = await request(app)
        .get('/api/food/totals');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totals).toEqual(mockTotals);
    });
  });

  describe('DELETE /api/food/entries/:id', () => {
    test('debe eliminar entrada exitosamente', async () => {
      db.query.mockImplementation((sql, values, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const response = await request(app)
        .delete('/api/food/entries/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('debe retornar 404 si entrada no existe', async () => {
      db.query.mockImplementation((sql, values, callback) => {
        callback(null, { affectedRows: 0 });
      });

      const response = await request(app)
        .delete('/api/food/entries/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});