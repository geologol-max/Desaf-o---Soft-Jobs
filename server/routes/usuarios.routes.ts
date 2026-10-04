import { Router } from 'express';
import {
  registrarUsuario,
  loginUsuario,
  obtenerUsuario,
} from '../controllers/usuarios.controller';
import { checkCredentials } from '../middlewares/checkCredentials';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();

/**
 * 1. Ruta POST /usuarios
 * Middleware: checkCredentials (Requerimiento 2.a)
 * Controlador: registrarUsuario (Requerimientos 1, 4, 5)
 */
router.post('/usuarios', checkCredentials, registrarUsuario);

/**
 * 2. Ruta POST /login
 * Middleware: checkCredentials (Requerimiento 2.a)
 * Controlador: loginUsuario (Requerimientos 1, 3, 4, 5)
 */
router.post('/login', checkCredentials, loginUsuario);

/**
 * 3. Ruta GET /usuarios
 * Middleware: verifyToken (Requerimientos 2.b, 3)
 * Controlador: obtenerUsuario (Requerimientos 1, 3, 4)
 */
router.get('/usuarios', verifyToken, obtenerUsuario);

export default router;
