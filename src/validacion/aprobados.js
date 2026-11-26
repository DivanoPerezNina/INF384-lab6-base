const repositorio = require('../data/repositorio');

const MAX_CODIGOS = 100;
const FORMATO_CODIGO = /^[A-Z0-9]{6}$/;

const falla = (error) => ({ ok: false, error });

// Valida el cuerpo de POST /habilitados. El orden importa: primero se acota
// el tamaño y el tipo, y solo después se recorre la lista (requisitos 3.1 y 5).
function validarAprobados(body) {
  if (!body || typeof body !== 'object' || !Object.prototype.hasOwnProperty.call(body, 'aprobados')) {
    return falla('aprobados es obligatorio');
  }

  const { aprobados } = body;
  if (!Array.isArray(aprobados)) {
    return falla('aprobados debe ser una lista de códigos');
  }
  if (aprobados.length > MAX_CODIGOS) {
    return falla(`aprobados admite como máximo ${MAX_CODIGOS} códigos`);
  }
  if (!aprobados.every((codigo) => typeof codigo === 'string')) {
    return falla('cada código debe ser texto');
  }
  // Mensaje sin eco del valor recibido (requisito 4.2).
  if (!aprobados.every((codigo) => FORMATO_CODIGO.test(codigo))) {
    return falla('aprobados contiene códigos con formato inválido');
  }

  const codigos = new Set(aprobados);
  const inexistentes = [...codigos].filter((codigo) => !repositorio.obtener(codigo));
  if (inexistentes.length > 0) {
    return falla(`códigos inexistentes: ${inexistentes.join(', ')}`);
  }

  return { ok: true, codigos };
}

module.exports = { validarAprobados, MAX_CODIGOS, FORMATO_CODIGO };
