const express = require('express');
const request = require('supertest');
const manejarErrores = require('../src/middleware/errores');

const RUTA_INTERNA = /(\/src\/|\\src\\|\bat\s|stack)/i;

function appQueFalla() {
  const app = express();
  app.get('/falla', () => {
    throw new Error('fallo en C:\\apps\\malla\\src\\algo.js');
  });
  app.use(manejarErrores);
  return app;
}

describe('middleware de errores · Requisito 4.3', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  test('4.3 un error no controlado responde 500 con { error: "error interno" } sin stack ni rutas', async () => {
    const res = await request(appQueFalla()).get('/falla');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'error interno' });
    expect(res.text).not.toMatch(RUTA_INTERNA);
    expect(res.text).not.toContain('apps');
  });
});
