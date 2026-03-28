const Joi = require('joi');

// Schema for creating food entry
const createFoodEntrySchema = Joi.object({
  descripcion: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .optional()
    .messages({
      'string.empty': 'La descripción no puede estar vacía',
      'string.max': 'La descripción no puede exceder 500 caracteres'
    }),

  calorias: Joi.number()
    .min(0)
    .max(10000)
    .optional()
    .messages({
      'number.min': 'Las calorías deben ser un número positivo',
      'number.max': 'Las calorías no pueden exceder 10,000'
    }),

  proteina: Joi.number()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'La proteína debe ser un número positivo',
      'number.max': 'La proteína no puede exceder 1,000g'
    }),

  carbohidratos: Joi.number()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Los carbohidratos deben ser un número positivo',
      'number.max': 'Los carbohidratos no pueden exceder 1,000g'
    }),

  fecha: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD'
    }),
  aiJson: Joi.alternatives().try(
    Joi.object({
      items: Joi.array().items(
        Joi.object({
          nombre: Joi.string().trim().max(200).required(),
          calorias: Joi.number().min(0).max(10000).required(),
          proteina: Joi.number().min(0).max(1000).required(),
          carbohidratos: Joi.number().min(0).max(1000).required()
        })
      ).required(),
      total: Joi.object({
        calorias: Joi.number().min(0).max(10000).required(),
        proteina: Joi.number().min(0).max(1000).required(),
        carbohidratos: Joi.number().min(0).max(1000).required()
      }).optional()
    }),
    Joi.string() // permite recibir json como string en multipart/form-data
  ).optional()
}).or('descripcion', 'calorias', 'proteina', 'carbohidratos', 'aiJson')
.messages({
  'object.missing': 'Debe proporcionar al menos descripción o valores nutricionales'
});

// Schema for updating food entry
const updateFoodEntrySchema = Joi.object({
  descripcion: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .optional()
    .messages({
      'string.empty': 'La descripción no puede estar vacía',
      'string.max': 'La descripción no puede exceder 500 caracteres'
    }),

  calorias: Joi.number()
    .min(0)
    .max(10000)
    .optional()
    .messages({
      'number.min': 'Las calorías deben ser un número positivo',
      'number.max': 'Las calorías no pueden exceder 10,000'
    }),

  proteina: Joi.number()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'La proteína debe ser un número positivo',
      'number.max': 'La proteína no puede exceder 1,000g'
    }),

  carbohidratos: Joi.number()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Los carbohidratos deben ser un número positivo',
      'number.max': 'Los carbohidratos no pueden exceder 1,000g'
    }),

  fecha: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD'
    })
}).min(1)
.messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar'
});

// Schema for login
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe proporcionar un email válido',
      'any.required': 'El email es requerido'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    })
});

// Schema for registration
const registerSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'El nombre de usuario no puede estar vacío',
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.max': 'El nombre de usuario no puede exceder 50 caracteres',
      'any.required': 'El nombre de usuario es requerido'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe proporcionar un email válido',
      'any.required': 'El email es requerido'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    })
});

// Middleware function to validate request body
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors
      });
    }
    next();
  };
};

module.exports = {
  createFoodEntrySchema,
  updateFoodEntrySchema,
  loginSchema,
  registerSchema,
  validate
};