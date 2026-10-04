import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para reportar por la terminal las consultas recibidas en el servidor.
 * Cumple con el Requerimiento 2.c de la pauta.
 */
export const logRequests = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const { method, originalUrl, query, body } = req;

  // Sanitizar el body para no mostrar passwords en texto plano en la consola
  const sanitizedBody = { ...body };
  if (sanitizedBody.password) {
    sanitizedBody.password = '****** (oculto por seguridad)';
  }

  const authHeader = req.headers.authorization
    ? `${req.headers.authorization.substring(0, 15)}...`
    : 'No Authorization header';

  console.log(`📡 [${timestamp}] ${method} ${originalUrl}`);
  if (Object.keys(query).length > 0) {
    console.log(`   └─ Query:`, JSON.stringify(query));
  }
  if (Object.keys(body || {}).length > 0) {
    console.log(`   └─ Body:`, JSON.stringify(sanitizedBody));
  }
  console.log(`   └─ Auth: ${authHeader}`);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`🏁 [${timestamp}] ${method} ${originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });

  next();
};
