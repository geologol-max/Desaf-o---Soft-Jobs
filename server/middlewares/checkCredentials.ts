import { Request, Response, NextFunction } from 'express';

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Middleware para verificar la existencia de credenciales en la ruta que corresponda.
 * Cumple con el Requerimiento 2.a de la pauta.
 * Verifica que el email y password vengan en el cuerpo de la petición.
 */
export const checkCredentials = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password, rol, lenguage } = req.body || {};

  // Validar existencia de email y password
  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({
      message: 'Email obligatorio: debe proporcionar un email válido.',
    });
    return;
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    res.status(400).json({
      message: 'Password obligatorio: debe proporcionar una contraseña.',
    });
    return;
  }

  if (!emailRegex.test(email.trim())) {
    res.status(400).json({
      message: 'El formato del email no es correcto.',
    });
    return;
  }

  // Si la petición es de registro (/usuarios), validar también rol y lenguage
  if (req.path === '/usuarios' || req.originalUrl.endsWith('/usuarios')) {
    if (!rol || typeof rol !== 'string' || rol === 'Seleccione un rol' || !rol.trim()) {
      res.status(400).json({
        message: 'Debe seleccionar un rol válido.',
      });
      return;
    }

    if (!lenguage || typeof lenguage !== 'string' || lenguage === 'Seleccione un Lenguage' || !lenguage.trim()) {
      res.status(400).json({
        message: 'Debe seleccionar un lenguaje válido.',
      });
      return;
    }
  }

  next();
};
