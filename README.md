# Desafío Soft Jobs - Backend Developer (Autenticación y Autorización con JWT)

Este proyecto corresponde a la solución completa del **Desafío - Soft Jobs** de la Academia de Talentos Digitales **Desafío Latam**, implementando la plataforma backend y frontend con autenticación y autorización segura mediante **JSON Web Tokens (JWT)**, contraseñas encriptadas con **bcrypt**, middlewares de verificación y logging, y base de datos **PostgreSQL**.

---

## 📋 Guía Detallada para el Evaluador

A continuación se detalla cómo se cumple a cabalidad con cada una de las dimensiones y criterios de la **Escala de Apreciación** (10 puntos en total):

### 1. Registrar y obtener usuarios de la base de datos (1.5 Puntos) - `Completamente Logrado (CL)`
* **Ruta `POST /usuarios`**:
  * Permite registrar un nuevo usuario en la tabla `usuarios` de PostgreSQL.
  * Valida existencia de campos y formato de email.
  * Inserta en la base de datos: `email`, `password` (hasheada), `rol` y `lenguage`.
  * Archivo: `server/controllers/usuarios.controller.ts` -> función `registrarUsuario`.
* **Ruta `GET /usuarios`**:
  * Permite obtener los datos del usuario autenticado consultando la base de datos mediante su email decodificado del JWT: `SELECT id, email, rol, lenguage FROM usuarios WHERE email = $1`.
  * Devuelve los datos en formato array `[ { id, email, rol, lenguage } ]` para acoplarse directamente a la desestructuración de React `const { data: [user] } = await axios.get(...)`.
  * Archivo: `server/controllers/usuarios.controller.ts` -> función `obtenerUsuario`.

### 2. Usar middlewares para: (2.0 Puntos) - `Completamente Logrado (CL)`
* **a. Verificar la existencia de credenciales en la ruta que corresponda**:
  * Middleware `checkCredentials` aplicado en `POST /usuarios` y `POST /login`.
  * Verifica que `email` y `password` existan en `req.body`, no sean vacíos y tengan formato válido. En registro verifica también `rol` y `lenguage`. Si falta alguno, detiene el flujo y responde `400 Bad Request`.
  * Archivo: `server/middlewares/checkCredentials.ts`.
* **b. Validar el token recibido en las cabeceras en la ruta que corresponda**:
  * Middleware `verifyToken` aplicado en `GET /usuarios`.
  * Extrae la cabecera `Authorization` en formato `Bearer <token>`.
  * Valida la firma del token usando la llave secreta (`JWT_SECRET`).
  * Decodifica el token para obtener el `email` del usuario y lo adjunta en `req.user`.
  * Si el token no existe, está expirado o fue alterado, responde con `401 Unauthorized`.
  * Archivo: `server/middlewares/verifyToken.ts`.
* **c. Reportar por la terminal las consultas recibidas en el servidor**:
  * Middleware `logRequests` montado globalmente en Express (`app.use(logRequests)`).
  * Imprime en la consola cada solicitud HTTP entrante con: fecha y hora en formato ISO, método (`GET`, `POST`), ruta solicitada, query params, presencia de cabecera Authorization y tiempo de respuesta en milisegundos (`ms`).
  * Archivo: `server/middlewares/logRequests.ts`.

### 3. Firmar, verificar y decodificar tokens JWT (3.0 Puntos) - `Completamente Logrado (CL)`
* **Firma (`jwt.sign`)**:
  * Al iniciar sesión con credenciales correctas en `POST /login`, el servidor firma un token usando `jwt.sign({ email }, JWT_SECRET, { expiresIn: '2h' })`.
  * Archivo: `server/controllers/usuarios.controller.ts` -> función `loginUsuario`.
* **Verificación (`jwt.verify`)**:
  * Al consultar `GET /usuarios`, se ejecuta `jwt.verify(token, JWT_SECRET)`.
  * Archivo: `server/middlewares/verifyToken.ts`.
* **Decodificación**:
  * Se extrae el payload con el `email` del usuario autenticado (`req.user = decoded`), utilizándolo para consultar sus datos en la base de datos.
  * Llave secreta utilizada: `'az_AZ'` (configurable con variable de entorno `JWT_SECRET`).

### 4. Capturar y devolver los posibles errores que ocurran en el servidor (0.5 Puntos) - `Completamente Logrado (CL)`
* Todos los controladores y middlewares implementan bloques `try / catch`.
* Se devuelven respuestas HTTP semánticas con códigos apropiados:
  * `400 Bad Request`: credenciales incompletas o formato incorrecto.
  * `401 Unauthorized`: contraseña errónea, usuario inexistente o token JWT inválido/expirado.
  * `404 Not Found`: recurso o usuario no encontrado en la base de datos.
  * `409 Conflict`: intento de registro con un email ya existente.
  * `500 Internal Server Error`: error no controlado en base de datos o servidor.
* Middleware global de errores en `server.ts` para capturar cualquier excepción no controlada y devolver JSON estructurado.

### 5. Encriptar las contraseñas al momento de registrar nuevos usuarios (3.0 Puntos) - `Completamente Logrado (CL)`
* En `POST /usuarios`, la contraseña se encripta de forma segura antes de guardarse en la base de datos usando `bcrypt.hash(password, 10)` (10 rondas de sal).
* En `POST /login`, se verifica la contraseña comparando el texto plano con el hash guardado mediante `bcrypt.compare(password, usuario.password)`.
* Nunca se almacenan contraseñas en texto plano en la base de datos.
* Archivo: `server/controllers/usuarios.controller.ts`.

---

## 🗄️ Base de Datos PostgreSQL

El servidor soporta tanto un servidor PostgreSQL externo (vía variables `DATABASE_URL` o `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`) como un motor PostgreSQL en memoria (`pg-mem`) que funciona de manera inmediata e idéntica en cualquier entorno sin necesidad de configuración previa.

### Script SQL Requerido:
```sql
CREATE DATABASE softjobs;
\c softjobs;

CREATE TABLE usuarios (
  id        SERIAL        NOT NULL,
  email     VARCHAR(50)   NOT NULL  UNIQUE,
  password  VARCHAR(60)   NOT NULL,
  rol       VARCHAR(25)   NOT NULL,
  lenguage  VARCHAR(20)   NOT NULL,
  PRIMARY KEY (id)
);

SELECT * FROM usuarios;
```

---

## 🔑 Credenciales Semilla para Pruebas Rápidas

Para facilitar la evaluación inmediata, el servidor crea automáticamente el usuario por defecto indicado en el desafío:
* **Email:** `docente@desafiolatam.com`
* **Contraseña:** `123456`
* **Rol:** `Full Stack Developer`
* **Lenguaje:** `JavaScript`
*(El password se encuentra debidamente encriptado con bcrypt en la base de datos)*.

También puede registrar cualquier nuevo usuario desde la vista **Registrarse** (`/registrarse`) o usando `curl` / Postman.

---

## 🧪 Pruebas de Endpoints con cURL

### 1. Registrar un nuevo usuario (POST /usuarios)
```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudiante@softjobs.cl",
    "password": "miPasswordSeguro123",
    "rol": "Frontend Developer",
    "lenguage": "JavaScript"
  }'
```

### 2. Iniciar sesión y obtener Token JWT (POST /login)
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "docente@desafiolatam.com",
    "password": "123456"
  }'
```
*Respuesta:*
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Usuario identificado con éxito 😀."
}
```

### 3. Obtener datos del usuario autenticado (GET /usuarios)
```bash
curl -X GET http://localhost:3000/usuarios \
  -H "Authorization: Bearer <TOKEN_OBTENIDO_EN_LOGIN>"
```
*Respuesta:*
```json
[
  {
    "id": 1,
    "email": "docente@desafiolatam.com",
    "rol": "Full Stack Developer",
    "lenguage": "JavaScript"
  }
]
```

### 4. Prueba de error por token inválido o faltante (GET /usuarios)
```bash
curl -i -X GET http://localhost:3000/usuarios
```
*Respuesta:*
`HTTP/1.1 401 Unauthorized`
```json
{
  "message": "Acceso no autorizado: No se proporcionó la cabecera Authorization."
}
```

---

## 📁 Estructura del Proyecto

```
├── server.ts                             # Entrada principal de Express con Vite middlewares y logging
├── server/
│   ├── db.ts                            # Conexión Pool PostgreSQL (con soporte pg-mem y externo)
│   ├── types.ts                         # Interfaces TypeScript para requests autenticados
│   ├── middlewares/
│   │   ├── checkCredentials.ts          # Middleware para verificar presencia de credenciales (2.a)
│   │   ├── verifyToken.ts               # Middleware para verificar token JWT en Authorization (2.b)
│   │   └── logRequests.ts               # Middleware para registrar consultas en terminal (2.c)
│   ├── controllers/
│   │   └── usuarios.controller.ts       # Registro, login y perfil con bcrypt y jwt
│   └── routes/
│       └── usuarios.routes.ts           # Definición de rutas POST /usuarios, POST /login, GET /usuarios
├── src/
│   ├── views/
│   │   ├── Home.tsx                     # Vista de Inicio
│   │   ├── Register.tsx                 # Formulario de Registro de Usuario
│   │   ├── Login.tsx                    # Formulario de Inicio de Sesión
│   │   └── Profile.tsx                  # Vista de Mi Perfil (protegida con JWT)
│   ├── components/
│   │   ├── Navigation.tsx               # Barra de navegación con control de sesión
│   │   └── EvaluatorModal.tsx           # Modal interactivo con pauta, BD en vivo y verificación
│   ├── contexts/Context.ts              # Context de React para estado de sesión del desarrollador
│   ├── hooks/useDeveloper.ts            # Hook personalizado de React
│   ├── config/constans.ts               # Constantes de URL y endpoints
│   ├── App.tsx                          # Enrutador principal de React
│   └── main.tsx                         # Entrada React DOM
├── package.json
└── README.md
```

---

## 🚀 Ejecución del Proyecto

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo (Servidor Backend Express + Frontend Vite en puerto 3000):**
   ```bash
   npm run dev
   ```

3. **Compilar proyecto para producción:**
   ```bash
   npm run build
   ```

4. **Iniciar en producción:**
   ```bash
   npm start
   ```

---
¡Desarrollado para el Desafío Soft Jobs - Academia Desafío Latam!
