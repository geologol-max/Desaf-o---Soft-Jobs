/**
 * Configuración de URLs y endpoints para la API del backend.
 * Compatible con la estructura oficial del Desafío Soft Jobs.
 */
export const URLBASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const ENDPOINT = {
  login: `${URLBASE}/login`,
  users: `${URLBASE}/usuarios`,
};
