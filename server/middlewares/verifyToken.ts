import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'az_AZ';

/**
 * Middleware para validar el token recibido en las cabeceras en la ruta que corresponda.
 * Cumple con el Requerimiento 2.b y 3 de la pauta:
 * - Extrae el token de la cabecera Authorization (Bearer <token>)
 * - Verifica la validez del token usando la llave secreta
 * - Decodifica el token para obtener el payload con el email
 * - Pasa el control con req.user al siguiente middleware/controlador
 */
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization || (req.headers.Authorization as string);

    if (!authHeader) {
      res.status(401).json({
        message: 'Acceso no autorizado: No se proporcionó la cabecera Authorization.',
      });
      return;
    }

    // Extraer token en formato "Bearer <token>" o directamente "<token>"
    const tokenParts = authHeader.split(' ');
    const token = tokenParts.length === 2 && tokenParts[0].toLowerCase() === 'bearer'
      ? tokenParts[1]
      : authHeader;

    if (!token) {
      res.status(401).json({
        message: 'Acceso no autorizado: Token no encontrado en la cabecera.',
      });
      return;
    }

    // Verificar y decodificar el token con la llave secreta
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; [key: string]: any };

    if (!decoded || !decoded.email) {
      res.status(401).json({
        message: 'Token inválido: No contiene información de usuario en el payload.',
      });
      return;
    }

    // Adjuntar la información decodificada a la petición
    req.user = decoded;
    next();
  } catch (error) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        message: 'El token ha expirado. Por favor, vuelva a iniciar sesión.',
      });
      return;
    }
    res.status(401).json({
      message: 'Token inválido o firma no autorizada.',
    });
  }
};
