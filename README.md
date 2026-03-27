# Gym App

Una aplicación completa de fitness con seguimiento de comidas, análisis de calorías con IA, y funcionalidades sociales.

## 🚀 Características

- **Registro y autenticación de usuarios** con JWT
- **Seguimiento de comidas** con análisis de calorías por IA
- **Análisis de imágenes** para conteo automático de calorías
- **Red social** con posts, stories y likes
- **Generación de rutinas** de ejercicio con IA
- **Dashboard** con métricas diarias de nutrición

## 🛡️ Seguridad

La aplicación implementa múltiples capas de seguridad:

### Rate Limiting
- **API General**: 100 solicitudes por IP cada 15 minutos
- **Autenticación**: 5 intentos de login por IP cada 15 minutos
- **IA**: 10 solicitudes de IA por IP cada hora
- **Uploads**: 20 subidas de archivos por IP cada hora

### Validación de Datos
- **Joi schemas** para validación robusta de entrada
- **Sanitización** automática de datos
- **Validación de tipos** y rangos para valores nutricionales

### Headers de Seguridad
- **Helmet.js** para configuración segura de headers HTTP
- **Content Security Policy** restrictiva
- **Protección XSS** y clickjacking

### Logging
- **Winston** para logging estructurado
- **Niveles de log**: error, warn, info, http, debug
- **Archivos separados** para errores y logs generales
- **Información contextual** en cada log

### Autenticación
- **JWT tokens** con expiración
- **Hashing de contraseñas** con bcrypt
- **Middleware de verificación** en rutas protegidas

## 🏗️ Arquitectura

```
src/
├── config/           # Configuración de BD, logger, cloudinary
├── controllers/      # Lógica de negocio
├── middlewares/      # Auth, upload, rate limiting, validation
├── models/          # Modelos de datos MySQL
├── routes/          # Definición de rutas API
└── app.js           # Punto de entrada
```

## 📦 Dependencias de Seguridad

- `express-rate-limit`: Control de tasa de solicitudes
- `helmet`: Headers de seguridad HTTP
- `joi`: Validación de esquemas de datos
- `winston`: Logging estructurado
- `bcryptjs`: Hashing de contraseñas
- `jsonwebtoken`: Tokens JWT

## 🧪 Testing

```bash
npm test
```

Tests incluyen:
- Modelos de datos
- Controladores API
- Validaciones de entrada
- Manejo de errores

## 🚀 Despliegue

1. Configurar variables de entorno en `.env`
2. Instalar dependencias: `npm install`
3. Ejecutar tests: `npm test`
4. Iniciar servidor: `npm start`

## 📊 Base de Datos

Tablas principales:
- `users`: Usuarios registrados
- `posts`: Publicaciones sociales
- `stories`: Historias temporales
- `food_entries`: Registros de comidas
- `likes`: Interacciones sociales

## 🔧 Variables de Entorno

```env
PORT=9090
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=gym_app
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:3000
```

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario

### Comidas
- `POST /api/food/entries` - Crear entrada de comida
- `GET /api/food/entries` - Obtener entradas del día
- `GET /api/food/totals` - Obtener totales diarios
- `DELETE /api/food/entries/:id` - Eliminar entrada

### IA
- `POST /api/ai/calories` - Análisis de calorías
- `POST /api/ai/routine` - Generar rutina
- `POST /api/ai/chat` - Chat con IA

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.