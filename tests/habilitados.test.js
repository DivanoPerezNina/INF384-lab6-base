const request = require('supertest');
const app = require('../src/app');
const repositorio = require('../src/data/repositorio');

const post = (body) => request(app).post('/habilitados').send(body);
const RUTA_INTERNA = /(\/src\/|\\src\\|\bat\s|stack)/i;

describe('POST /habilitados · Requisito 1', () => {
  test('1.1 con 1INF25, 1INF27 y 1INF49 devuelve 27 cursos con 1INF29, 1INF30, 1INF31 y 1INF32', async () => {
    const res = await post({ aprobados: ['1INF25', '1INF27', '1INF49'] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(27);
    const ids = res.body.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['1INF29', '1INF30', '1INF31', '1INF32']));
  });

  test('1.2 excluye los cursos aprobados', async () => {
    const res = await post({ aprobados: ['1INF25', '1INF27', '1INF49'] });

    const ids = res.body.map((c) => c.id);
    expect(ids).not.toContain('1INF25');
    expect(ids).not.toContain('1INF27');
    expect(ids).not.toContain('1INF49');
  });

  test('1.3 excluye cursos con algún requisito fuera de aprobados', async () => {
    const aprobados = ['1INF25', '1INF27', '1INF49'];
    const res = await post({ aprobados });

    for (const { id } of res.body) {
      const curso = repositorio.obtener(id);
      expect(curso.prerequisites.every((p) => aprobados.includes(p))).toBe(true);
    }
    // 1INF30 requiere 1INF25 (está); un curso que requiera 1INF30 no debe salir.
    const dependeDe30 = repositorio.listar().filter((c) => c.prerequisites.includes('1INF30'));
    expect(dependeDe30.length).toBeGreaterThan(0);
    for (const curso of dependeDe30) {
      expect(res.body.map((c) => c.id)).not.toContain(curso.id);
    }
  });

  test('1.4 con lista vacía devuelve exactamente los cursos sin requisitos', async () => {
    const res = await post({ aprobados: [] });

    const esperados = repositorio.listar().filter((c) => c.prerequisites.length === 0).map((c) => c.id);
    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.id)).toEqual(esperados);
  });

  test('1.5 cada curso trae id, name, credits, cycle y type en el orden de cursos.json', async () => {
    const res = await post({ aprobados: ['1INF25'] });

    for (const curso of res.body) {
      expect(Object.keys(curso).sort()).toEqual(['credits', 'cycle', 'id', 'name', 'type']);
    }
    const orden = repositorio.listar().map((c) => c.id);
    const indices = res.body.map((c) => orden.indexOf(c.id));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  test('1.6 los códigos repetidos dan el mismo resultado', async () => {
    const simple = await post({ aprobados: ['1INF25', '1INF27'] });
    const repetido = await post({ aprobados: ['1INF25', '1INF25', '1INF27', '1INF27'] });

    expect(repetido.status).toBe(200);
    expect(repetido.body).toEqual(simple.body);
  });
});

describe('POST /habilitados · Requisito 2', () => {
  test('2.1 un código con formato válido que no existe responde 400 nombrándolo', async () => {
    const res = await post({ aprobados: ['1INF25', '1INF99'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('1INF99');
  });
});

describe('POST /habilitados · Requisito 3 (hallazgo 1)', () => {
  const cincoMil = Array.from({ length: 5000 }, () => '1INF25');

  test('3.1 más de 100 elementos responde 400 en menos de 500 ms', async () => {
    const inicio = Date.now();
    const res = await post({ aprobados: Array.from({ length: 101 }, () => '1INF25') });

    expect(Date.now() - inicio).toBeLessThan(500);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  test('3.1 exactamente 100 elementos válidos se acepta', async () => {
    const res = await post({ aprobados: Array.from({ length: 100 }, () => '1INF25') });

    expect(res.status).toBe(200);
  });

  test('3.2 un cuerpo mayor a 10 KB responde 413', async () => {
    const res = await post({ aprobados: cincoMil });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  test('3.3 una lista de 5 000 códigos responde 413', async () => {
    const res = await post({ aprobados: cincoMil });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  test('3.4 mientras se atiende una solicitud de 5 000 códigos, /health responde 200 en menos de 500 ms', async () => {
    const inicio = Date.now();
    const [, salud] = await Promise.all([post({ aprobados: cincoMil }), request(app).get('/health')]);

    expect(salud.status).toBe(200);
    expect(Date.now() - inicio).toBeLessThan(500);
  });
});

describe('POST /habilitados · Requisito 4 (hallazgo 2)', () => {
  test('4.1 un código con formato inválido responde 400', async () => {
    const res = await post({ aprobados: ['1INF30<script>'] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  test.each(['1inf25', '1INF2', '1INF255', '', ' 1INF25'])('4.1 rechaza el código "%s"', async (codigo) => {
    const res = await post({ aprobados: [codigo] });

    expect(res.status).toBe(400);
  });

  test('4.2 el error de formato no refleja el texto recibido', async () => {
    const res = await post({ aprobados: ['1INF30<script>'] });

    expect(res.text).not.toContain('<script>');
    expect(res.text).not.toContain('1INF30<');
  });

  test('4.4 un cuerpo que no es JSON válido responde 400 sin stack trace', async () => {
    const res = await request(app)
      .post('/habilitados')
      .set('Content-Type', 'application/json')
      .send('{"aprobados": [');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
    expect(res.text).not.toMatch(RUTA_INTERNA);
  });
});

describe('POST /habilitados · Requisito 5 (hallazgo 3)', () => {
  test('5.1 aprobados como texto responde 400', async () => {
    const res = await post({ aprobados: '1INF25' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  test.each([[{}], [{ otro: [] }]])('5.2 sin la propiedad aprobados responde 400 (%j)', async (body) => {
    const res = await post(body);

    expect(res.status).toBe(400);
  });

  test.each([[123], [null], [{ id: '1INF25' }], [['1INF25']]])('5.3 un elemento no texto (%j) responde 400', async (elemento) => {
    const res = await post({ aprobados: ['1INF27', elemento] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });
});
