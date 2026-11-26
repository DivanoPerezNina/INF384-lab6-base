const request = require('supertest');
const app = require('../src/app');

describe('GET /cursos', () => {
  test('1.1 devuelve todos los cursos con código, nombre, créditos, ciclo y tipo', async () => {
    const res = await request(app).get('/cursos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(87);
    expect(Object.keys(res.body[0]).sort()).toEqual(['credits', 'cycle', 'id', 'name', 'type']);
  });

  test('1.2 con ?ciclo=10 devuelve solo los cursos de ese ciclo', async () => {
    const res = await request(app).get('/cursos?ciclo=10');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body.every((c) => c.cycle === 10)).toBe(true);
  });

  test.each(['4', '11', 'abc', '7.5', '-6'])('1.3 con ciclo=%s responde 400', async (ciclo) => {
    const res = await request(app).get(`/cursos?ciclo=${ciclo}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });
});

describe('GET /cursos/:codigo', () => {
  test('2.1 devuelve el curso con código y nombre de cada requisito', async () => {
    const res = await request(app).get('/cursos/1INF30');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Programación 3');
    expect(res.body.prerequisites).toEqual([{ id: '1INF25', name: 'Programación 2' }]);
  });

  test('2.2 responde 404 si el código no existe', async () => {
    const res = await request(app).get('/cursos/XXX999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'curso no encontrado' });
  });
});

describe('Calidad del servicio', () => {
  test('3.2 GET /cursos responde en menos de 200 ms', async () => {
    const inicio = Date.now();
    const res = await request(app).get('/cursos');

    expect(res.status).toBe(200);
    expect(Date.now() - inicio).toBeLessThan(200);
  });
});
