const repositorio = require('../data/repositorio');

// Requisito 1: cursos no aprobados cuyos requisitos están todos en aprobados.
// Mantiene el orden de data/cursos.json.
function calcularHabilitados(aprobados) {
  return repositorio
    .listar()
    .filter((curso) => !aprobados.has(curso.id))
    .filter((curso) => curso.prerequisites.every((codigo) => aprobados.has(codigo)))
    .map(({ id, name, credits, cycle, type }) => ({ id, name, credits, cycle, type }));
}

module.exports = { calcularHabilitados };
