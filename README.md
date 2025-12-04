# Sanedrín - Apuestas Web

Aplicación web para gestionar una liga de fantasía de fútbol (Porra del Sanedrín).

## 🚀 Características

- ✅ Gestión de temporadas y participantes
- ✅ Selección de equipos (Primera, Segunda, Champions)
- ✅ Sincronización automática de partidos desde API-Football
- ✅ Cálculo automático de puntos
- ✅ Clasificaciones en tiempo real
- ✅ Sistema de cambios de equipos
- ✅ Interfaz de administración

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de Supabase (gratis)
- API Key de API-Football (plan gratuito)

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/Sanedin-apuestas-web-2.git
   cd Sanedin-apuestas-web-2
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crear archivo `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   VITE_FOOTBALL_API_KEY=tu_api_football_key
   ```

4. **Configurar base de datos**
   
   Ejecutar los scripts SQL en Supabase SQL Editor en este orden:
   ```
   1. database/base-schema.sql
   2. database/setup.sql
   3. database/auth-functions.sql
   4. database/permissions.sql
   5. database/FIX_SEASON_SCHEMA.sql
   6. database/ADD_MATCHES_CONSTRAINT.sql
   ```

5. **Iniciar en desarrollo**
   ```bash
   npm run dev
   ```

## 🤖 Sincronización Automática

El proyecto incluye un GitHub Action que sincroniza partidos automáticamente cada 15 minutos.

### Configurar GitHub Secrets

En tu repositorio de GitHub, ve a `Settings` > `Secrets and variables` > `Actions` y añade:

- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Anon key de Supabase
- `VITE_FOOTBALL_API_KEY`: Tu API key de API-Football

El workflow se ejecutará automáticamente cada 15 minutos (75 veces al día, dentro del límite de 100 peticiones/día del plan gratuito).

### Sincronización Manual

Los administradores pueden sincronizar manualmente desde la interfaz web usando el botón "Actualizar Partidos" en la página de Partidos.

## 📊 Limitaciones del Plan Gratuito

- **API-Football**: 100 peticiones/día
- **Sincronización automática**: 75 peticiones/día (cada 15 min)
- **Sincronización manual**: 25 peticiones disponibles
- **Datos disponibles**: Solo fecha actual (ayer y hoy)
- **Solución**: Cargar datos históricos manualmente en la base de datos

## 🗄️ Estructura del Proyecto

```
├── .github/workflows/    # GitHub Actions
├── database/            # Scripts SQL
├── src/
│   ├── api/            # Endpoints API
│   ├── components/     # Componentes React
│   ├── config/         # Configuración
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Páginas
│   ├── services/       # Servicios (API, DB)
│   ├── stores/         # Zustand stores
│   └── types/          # TypeScript types
└── public/             # Assets estáticos
```

## 👥 Usuarios por Defecto

Después de ejecutar `setup.sql`:

- **Admin**: username: `Admin`, password: `admin123`
- **Usuario 1**: username: `User1`, password: `user123`

## 📝 Licencia

MIT

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.
