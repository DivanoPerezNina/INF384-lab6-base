const path = require('path');
const express = require('express');
const repositorio = require('./data/repositorio');
const manejarErrores = require('./middleware/errores');

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cursos: repositorio.listar().length });
});

app.use('/cursos', require('./routes/cursos'));

app.use(manejarErrores);

module.exports = app;
