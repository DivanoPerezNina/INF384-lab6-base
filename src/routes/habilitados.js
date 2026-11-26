const express = require('express');
const { validarAprobados } = require('../validacion/aprobados');
const { calcularHabilitados } = require('../servicios/habilitados');

const router = express.Router();

router.post('/', (req, res) => {
  const resultado = validarAprobados(req.body);
  if (!resultado.ok) {
    return res.status(400).json({ error: resultado.error });
  }
  return res.json(calcularHabilitados(resultado.codigos));
});

module.exports = router;
