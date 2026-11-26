const { calcularHabilitados } = require('../src/servicios/habilitados');

describe('calcularHabilitados', () => {
  test('1.1 con 1INF25, 1INF27 y 1INF49 devuelve 27 cursos', () => {
    const r = calcularHabilitados(new Set(['1INF25', '1INF27', '1INF49']));

    expect(r).toHaveLength(27);
    expect(r.map((c) => c.id)).toEqual(expect.arrayContaining(['1INF29', '1INF30', '1INF31', '1INF32']));
  });

  test('1.2 no incluye cursos aprobados', () => {
    const r = calcularHabilitados(new Set(['1INF25']));

    expect(r.map((c) => c.id)).not.toContain('1INF25');
  });

  test('1.3 no incluye 1INF30 si falta 1INF25', () => {
    expect(calcularHabilitados(new Set()).map((c) => c.id)).not.toContain('1INF30');
  });

  test('1.5 proyecta solo id, name, credits, cycle y type', () => {
    const [primero] = calcularHabilitados(new Set());

    expect(Object.keys(primero).sort()).toEqual(['credits', 'cycle', 'id', 'name', 'type']);
  });
});
