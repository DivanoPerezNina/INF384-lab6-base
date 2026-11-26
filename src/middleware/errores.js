// Manejador de errores final. Nunca devuelve el stack ni rutas internas.
// eslint-disable-next-line no-unused-vars
function manejarErrores(err, req, res, next) {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'solicitud demasiado grande' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  console.error(err);
  return res.status(500).json({ error: 'error interno' });
}

module.exports = manejarErrores;
