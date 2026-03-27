const foodModel = require('../foodModel');

// Mock de DB
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

const db = require('../../config/db');

describe('Food Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFoodEntry', () => {
    test('debe crear entrada correctamente', (done) => {
      const mockEntry = {
        user_id: 1,
        descripcion: 'Manzana',
        calorias: 50,
        proteina: 0.5,
        carbohidratos: 12,
        fecha: '2026-03-27',
        image_url: null
      };

      db.query.mockImplementation((sql, values, callback) => {
        callback(null, { insertId: 123 });
      });

      foodModel.createFoodEntry(mockEntry, (err, result) => {
        expect(err).toBeNull();
        expect(result.insertId).toBe(123);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO food_entries'),
          expect.any(Array),
          expect.any(Function)
        );
        done();
      });
    });

    test('debe manejar errores de DB', (done) => {
      const mockEntry = { user_id: 1, descripcion: 'Test' };

      db.query.mockImplementation((sql, values, callback) => {
        callback(new Error('DB Error'), null);
      });

      foodModel.createFoodEntry(mockEntry, (err, result) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('DB Error');
        done();
      });
    });
  });

  describe('getFoodEntriesByUserAndDate', () => {
    test('debe obtener entradas por usuario y fecha', (done) => {
      const userId = 1;
      const fecha = '2026-03-27';
      const mockResults = [
        { id: 1, descripcion: 'Manzana', calorias: 50 }
      ];

      db.query.mockImplementation((sql, values, callback) => {
        callback(null, mockResults);
      });

      foodModel.getFoodEntriesByUserAndDate(userId, fecha, (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual(mockResults);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [userId, fecha],
          expect.any(Function)
        );
        done();
      });
    });
  });

  describe('getDailyTotals', () => {
    test('debe calcular totales diarios correctamente', (done) => {
      const userId = 1;
      const fecha = '2026-03-27';
      const mockResults = [{ total_calorias: 150, total_proteina: 5, total_carbohidratos: 20 }];

      db.query.mockImplementation((sql, values, callback) => {
        callback(null, mockResults);
      });

      foodModel.getDailyTotals(userId, fecha, (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual(mockResults);
        done();
      });
    });
  });
});