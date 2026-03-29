const request = require('supertest');
const express = require('express');
const foodController = require('../foodController');
const db = require('../../config/db');

// Mock de DB
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Mock de axios para LogMeal y Gemini
const axios = require('axios');
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

// Mock de GoogleGenerativeAI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => '{"total":{"calorias":200,"proteina":10,"carbohidratos":30},"items":[{"nombre":"Pollo","calorias":200,"proteina":10,"carbohidratos":30}]}'
        }
      })
    })
  }))
}));

const app = express();
app.use(express.json());

// Middleware para simular usuario autenticado
app.use((req, res, next) => {
  req.user = { id: 1 }; // Simular usuario con ID 1
  next();
});

// Routes
app.post('/api/food/entries', foodController.createFoodEntry);
app.get('/api/food/entries', foodController.getFoodEntries);
app.get('/api/food/totals', foodController.getDailyTotals);
app.delete('/api/food/entries/:id', foodController.deleteFoodEntry);

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

    test('debe crear entradas desde aiJson (bulk)', async () => {
      const bulkItems = [
        { nombre: 'Ensalada', calorias: 150, proteina: 5, carbohidratos: 20 },
        { nombre: 'Pollo', calorias: 220, proteina: 30, carbohidratos: 0 }
      ];

      db.query.mockImplementation((sql, values, callback) => {
        callback(null, { affectedRows: 2, insertId: 1 });
      });

      const response = await request(app)
        .post('/api/food/entries')
        .send({ aiJson: { items: bulkItems, total: { calorias: 370, proteina: 35, carbohidratos: 20 } } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('bulk');
      expect(response.body.insertedCount).toBe(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO food_entries'),
        expect.any(Array),
        expect.any(Function)
      );
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