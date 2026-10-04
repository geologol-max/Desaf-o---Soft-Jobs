import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../db';
import { AuthenticatedRequest } from '../types';
import { JWT_SECRET } from '../middlewares/verifyToken';

/**
 * Registra un nuevo usuario en la base de datos con contraseña encriptada.
 * Cumple con los Requerimientos 1, 4 y 5 de la pauta.
 * Ruta: POST /usuarios
 */
export const registrarUsuario = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, rol, lenguage } = req.body;
    const pool = getPool();

    // Verificar si el usuario ya existe
    const userCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.trim()]);
    if (userCheck.rows.length > 0) {
      res.status(409).json({
        message: 'El correo electrónico ya se encuentra registrado.',
      });
      return;
    }

    // Requerimiento 5: Encriptar la contraseña usando bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Requerimiento 1: Registrar en la base de datos
    const insertQuery = `
      INSERT INTO usuarios (email, password, rol, lenguage)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, rol, lenguage;
    `;
    const values = [email.trim().toLowerCase(), hashedPassword, rol.trim(), lenguage.trim()];
    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      message: 'Usuario registrado con éxito 😀.',
      usuario: result.rows[0],
    });
  } catch (error) {
    // Requerimiento 4: Capturar y devolver errores en el servidor
    console.error('Error en registrarUsuario:', error);
    res.status(500).json({
      message: 'Error al registrar el usuario en el servidor.',
      error: (error as Error).message,
    });
  }
};

/**
 * Autentica un usuario y genera un token JWT con su email en el payload.
 * Cumple con los Requerimientos 3, 4 y 5 de la pauta.
 * Ruta: POST /login
 */
export const loginUsuario = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const pool = getPool();

    // Requerimiento 1: Obtener usuario de la base de datos
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email.trim().toLowerCase()]);

    if (result.rows.length === 0) {
      res.status(401).json({
        message: 'Credenciales inválidas: usuario o contraseña incorrectos.',
      });
      return;
    }

    const usuario = result.rows[0];

    // Requerimiento 5: Comparar contraseña encriptada con bcrypt
    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      res.status(401).json({
        message: 'Credenciales inválidas: usuario o contraseña incorrectos.',
      });
      return;
    }

    // Requerimiento 3: Firmar token JWT con el email en el payload
    const payload = {
      email: usuario.email,
    };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(200).json({
      token,
      message: 'Usuario identificado con éxito 😀.',
    });
  } catch (error) {
    // Requerimiento 4: Capturar y devolver errores en el servidor
    console.error('Error en loginUsuario:', error);
    res.status(500).json({
      message: 'Error interno en el servidor durante el inicio de sesión.',
      error: (error as Error).message,
    });
  }
};

/**
 * Obtiene los datos del usuario autenticado a partir del token JWT.
 * Cumple con los Requerimientos 1, 2.b, 3 y 4 de la pauta.
 * Ruta: GET /usuarios
 */
export const obtenerUsuario = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Requerimiento 3: Decodificar el token para obtener el email del payload
    const email = req.user?.email;

    if (!email) {
      res.status(401).json({
        message: 'No se encontró la información del usuario en el token.',
      });
      return;
    }

    // Requerimiento 1: Obtener usuario de la base de datos
    const pool = getPool();
    const query = 'SELECT id, email, rol, lenguage FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      res.status(404).json({
        message: 'Usuario no encontrado en la base de datos.',
      });
      return;
    }

    // ATENCIÓN: El frontend React de Desafío Latam espera un array de usuarios en:
    // axios.get(ENDPOINT.users).then(({ data: [user] }) => setDeveloper({ ...user }))
    // Por ello, devolvemos result.rows (array de usuarios con el usuario en el índice 0)
    res.status(200).json(result.rows);
  } catch (error) {
    // Requerimiento 4: Capturar y devolver errores en el servidor
    console.error('Error en obtenerUsuario:', error);
    res.status(500).json({
      message: 'Error al consultar los datos del usuario en el servidor.',
      error: (error as Error).message,
    });
  }
};
