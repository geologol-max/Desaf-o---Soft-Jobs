import { Pool, PoolConfig } from 'pg';
import { newDb } from 'pg-mem';
import bcrypt from 'bcryptjs';

let activePool: Pool;
let isInMemory = false;

// SQL initialization script conforming to Desafío specifications
export const INIT_SQL = `
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(60) NOT NULL,
  rol VARCHAR(25) NOT NULL,
  lenguage VARCHAR(20) NOT NULL
);
`;

/**
 * Initializes the database connection.
 * Attempts to connect to real PostgreSQL if credentials are provided in env;
 * otherwise automatically initializes an in-memory PostgreSQL instance using pg-mem.
 */
export async function initializeDatabase(): Promise<Pool> {
  if (activePool) return activePool;

  const hasPgEnv = !!(
    process.env.DATABASE_URL ||
    process.env.PGHOST ||
    process.env.DB_HOST
  );

  if (hasPgEnv) {
    try {
      console.log('🔄 Intentando conectar a PostgreSQL externo...');
      const config: PoolConfig = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
            port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
            user: process.env.PGUSER || process.env.DB_USER || 'postgres',
            password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
            database: process.env.PGDATABASE || process.env.DB_NAME || 'softjobs',
          };

      const realPool = new Pool(config);
      await realPool.query('SELECT NOW()');
      await realPool.query(INIT_SQL);
      console.log('✅ Conexión exitosa a PostgreSQL externo.');
      activePool = realPool;
      isInMemory = false;
      await seedDefaultUser(activePool);
      return activePool;
    } catch (err) {
      console.warn('⚠️ No se pudo conectar a PostgreSQL externo, iniciando PostgreSQL en memoria (pg-mem)...', (err as Error).message);
    }
  }

  // Fallback / Default: In-memory PostgreSQL instance via pg-mem
  console.log('📦 Inicializando base de datos PostgreSQL en memoria con pg-mem...');
  const memDb = newDb();
  const pgMem = memDb.adapters.createPg();
  const memPool = new pgMem.Pool();

  await memPool.query(INIT_SQL);
  console.log('✅ Tabla "usuarios" creada satisfactoriamente en pg-mem.');
  activePool = memPool;
  isInMemory = true;
  await seedDefaultUser(activePool);

  return activePool;
}

/**
 * Seeds the default user specified in the Desafío Latam material:
 * email: docente@desafiolatam.com
 * password: hash of '123456'
 */
async function seedDefaultUser(pool: Pool) {
  try {
    const existing = await pool.query('SELECT * FROM usuarios WHERE email = $1', ['docente@desafiolatam.com']);
    if (existing.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await pool.query(
        'INSERT INTO usuarios (email, password, rol, lenguage) VALUES ($1, $2, $3, $4)',
        ['docente@desafiolatam.com', hashedPassword, 'Full Stack Developer', 'JavaScript']
      );
      console.log('🌱 Usuario semilla inicial creado: docente@desafiolatam.com / 123456');
    }
  } catch (error) {
    console.error('Error al sembrar usuario por defecto:', error);
  }
}

export function getPool(): Pool {
  if (!activePool) {
    throw new Error('La base de datos aún no ha sido inicializada. Llama a initializeDatabase() primero.');
  }
  return activePool;
}

export function isUsingInMemoryDb(): boolean {
  return isInMemory;
}
