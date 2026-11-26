const path = require('path');
const express = require('express');
const repositorio = require('./data/repositorio');
const manejarErrores = require('./middleware/errores');

const app = express();

app.disable('x-powered-by');
// Requisito 3.2: cuerpos de más de 10 KB se rechazan con 413 antes de parsear.
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cursos: repositorio.listar().length });
});

app.use('/cursos', require('./routes/cursos'));

app.use(manejarErrores);

module.exports = app;
