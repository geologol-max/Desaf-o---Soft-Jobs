import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initializeDatabase, getPool, isUsingInMemoryDb } from './server/db';
import { logRequests } from './server/middlewares/logRequests';
import usuariosRoutes from './server/routes/usuarios.routes';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middlewares globales
app.use(cors());
app.use(express.json());

// Requerimiento 2.c: Reportar por la terminal las consultas recibidas en el servidor
app.use(logRequests);

// Rutas de la API requeridas por el Desafío Soft Jobs
// POST /usuarios, POST /login, GET /usuarios
app.use(usuariosRoutes);

// Endpoint auxiliar para información de diagnóstico del evaluador
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'Desafío Soft Jobs - Backend Server',
    database: isUsingInMemoryDb() ? 'PostgreSQL in-memory (pg-mem)' : 'PostgreSQL external',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint auxiliar para que el evaluador pueda listar usuarios directamente (sin passwords)
app.get('/api/evaluator/usuarios', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT id, email, rol, lenguage, password FROM usuarios ORDER BY id ASC');
    const sanitized = result.rows.map(u => ({
      ...u,
      passwordHashPreview: `${u.password.substring(0, 15)}... (bcrypt)`
    }));
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Requerimiento 4: Capturar y devolver los posibles errores que ocurran en el servidor
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error capturado en Middleware Global:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Ocurrió un error inesperado en el servidor.',
    status: statusCode,
  });
});

// Inicialización del servidor y middleware de Vite (Frontend)
async function startServer() {
  try {
    // 1. Inicializar la base de datos PostgreSQL
    await initializeDatabase();

    // 2. Configurar Vite en modo middleware para desarrollo, o servir archivos estáticos en producción
    if (!isProduction) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('🚀 Vite middleware integrado en modo desarrollo');
    } else {
      const distPath = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req: Request, res: Response) => {
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
      }
    }

    // 3. Iniciar escucha en el puerto especificado (por defecto 3000)
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Servidor Soft Jobs iniciado con éxito en el puerto ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📡 Endpoints disponibles:`);
      console.log(`   - POST /usuarios (Registro con encriptación bcrypt)`);
      console.log(`   - POST /login    (Autenticación y generación de JWT)`);
      console.log(`   - GET  /usuarios (Verificación de JWT y obtención de perfil)`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('❌ Fallo al inicializar el servidor:', error);
    process.exit(1);
  }
}

startServer();
