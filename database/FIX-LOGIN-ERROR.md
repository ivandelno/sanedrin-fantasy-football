# 🔧 Solución al Error de Login (401 Unauthorized)

## ❌ El Problema

Estás viendo este error en la consola:
```
POST https://vflglznpkjhdstojgvij.supabase.co/rest/v1/rpc/login_user 401 (Unauthorized)
```

**Causa:** La función `login_user` no existe en tu base de datos de Supabase.

## ✅ La Solución

Necesitas ejecutar el script SQL que crea las funciones de autenticación.

### Paso 1: Abre Supabase SQL Editor

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **SQL Editor**

### Paso 2: Ejecuta el Script de Autenticación

1. Abre el archivo `database/auth-functions.sql` de este proyecto
2. **Copia TODO el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona Ctrl+Enter)

### Paso 3: Verifica que se Crearon las Funciones

Ejecuta este query en el SQL Editor para verificar:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND routine_name IN ('login_user', 'verify_user_password', 'create_user');
```

Deberías ver 3 funciones listadas:
- `login_user`
- `verify_user_password`
- `create_user`

### Paso 4: Ejecuta el Script de Permisos ⚠️ CRÍTICO

**¡Este es el paso que probablemente te falta si sigues viendo error 401!**

1. Abre el archivo `database/permissions.sql` de este proyecto
2. **Copia TODO el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona Ctrl+Enter)

**¿Por qué es necesario?**

Aunque las funciones existan, Supabase usa **Row Level Security (RLS)** y permisos de roles. El rol `anon` (que usa tu aplicación web) necesita permiso explícito para ejecutar las funciones RPC.

El script `permissions.sql`:
- ✅ Otorga permiso `EXECUTE` en las funciones a los roles `anon` y `authenticated`
- ✅ Otorga permisos de lectura/escritura en las tablas
- ✅ Deshabilita RLS temporalmente para desarrollo

**Sin este paso, seguirás viendo error 401 aunque las funciones existan.**

### Paso 5: Prueba el Login

1. Vuelve a tu aplicación web
2. Recarga la página (F5)
3. Intenta hacer login con:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`

   O con:
   - **Usuario:** `usuario1`
   - **Contraseña:** `user123`

## 📋 Funciones Creadas

El script `auth-functions.sql` crea las siguientes funciones:

### 1. `login_user(username, password)`
- Verifica las credenciales del usuario
- Retorna los datos del usuario si las credenciales son correctas
- Usa `crypt()` para comparar contraseñas de forma segura

### 2. `verify_user_password(uid, password)`
- Verifica si una contraseña es correcta para un usuario específico
- Usado para cambios de contraseña

### 3. `create_user(username, password, is_admin)`
- Crea un nuevo usuario con contraseña encriptada
- Retorna el ID del usuario creado

## 🔒 Seguridad

Todas las funciones usan:
- **pgcrypto** para encriptación de contraseñas con bcrypt
- **SECURITY DEFINER** para ejecutarse con privilegios de la base de datos
- Nunca almacenan contraseñas en texto plano

## ⚠️ Importante

Si ya ejecutaste `base-schema.sql` y `setup.sql` anteriormente, **solo necesitas ejecutar `auth-functions.sql`** para solucionar el problema de login.

## 🆘 Si Sigue Sin Funcionar

### Error: "cannot change return type of existing function"

Si ves este error:
```
ERROR: 42P13: cannot change return type of existing function
HINT: Use DROP FUNCTION login_user(text,text) first.
```

**Solución:** El script `auth-functions.sql` ya incluye las sentencias `DROP FUNCTION IF EXISTS` al inicio. Simplemente vuelve a copiar y ejecutar todo el contenido del archivo actualizado.

### Verificación de Funciones

1. Verifica que las funciones se crearon correctamente (Paso 3 arriba)
2. Revisa la consola del navegador para ver si hay otros errores
3. Verifica que tu URL de Supabase y la API key en `.env` sean correctas
4. Asegúrate de que los usuarios de prueba existen en la tabla `users`

### Paso 5: Actualización Automática del Frontend

He actualizado el archivo `src/services/auth.service.ts` para que coincida con los nuevos nombres de parámetros de la base de datos (`p_username` en lugar de `username`).

**No necesitas hacer nada aquí**, el cambio ya se aplicó automáticamente.

### Paso 6: Prueba Final

1. Vuelve a tu aplicación web
2. **IMPORTANTE:** Haz una recarga forzada (Ctrl+F5) para asegurar que se cargue el nuevo código JavaScript
3. Intenta hacer login de nuevo

Si todo ha ido bien:
- ✅ La base de datos tiene las funciones correctas (sin `updated_at`)
- ✅ Los permisos están configurados
- ✅ El frontend envía los parámetros correctos (`p_username`)

¡El login debería funcionar! 🎉
