const express = require('express');
const repositorio = require('../data/repositorio');

const router = express.Router();

function resumen({ id, name, credits, cycle, type }) {
  return { id, name, credits, cycle, type };
}

router.get('/', (req, res) => {
  const { ciclo } = req.query;

  if (ciclo === undefined) {
    return res.json(repositorio.listar().map(resumen));
  }

  const numero = Number(ciclo);
  if (!/^\d+$/.test(String(ciclo)) || numero < 5 || numero > 10) {
    return res.status(400).json({ error: 'ciclo debe ser un entero entre 5 y 10' });
  }

  return res.json(repositorio.listarPorCiclo(numero).map(resumen));
});

router.get('/:codigo', (req, res) => {
  const curso = repositorio.obtener(req.params.codigo);
  if (!curso) {
    return res.status(404).json({ error: 'curso no encontrado' });
  }

  const prerequisites = curso.prerequisites.map((id) => {
    const requisito = repositorio.obtener(id);
    return { id, name: requisito ? requisito.name : null };
  });

  return res.json({ ...resumen(curso), prerequisites });
});

module.exports = router;
