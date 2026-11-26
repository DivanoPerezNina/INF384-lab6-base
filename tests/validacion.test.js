const { validarAprobados, MAX_CODIGOS } = require('../src/validacion/aprobados');

describe('validarAprobados', () => {
  test('acepta una lista válida y deduplica', () => {
    const r = validarAprobados({ aprobados: ['1INF25', '1INF25', 'INF275'] });

    expect(r.ok).toBe(true);
    expect([...r.codigos]).toEqual(['1INF25', 'INF275']);
  });

  test.each([undefined, null, 'texto', {}])('5.2 rechaza un cuerpo sin aprobados (%j)', (body) => {
    expect(validarAprobados(body)).toEqual({ ok: false, error: 'aprobados es obligatorio' });
  });

  test('5.1 rechaza aprobados que no es arreglo', () => {
    expect(validarAprobados({ aprobados: '1INF25' }).error).toBe('aprobados debe ser una lista de códigos');
  });

  test('3.1 rechaza más de 100 elementos', () => {
    const r = validarAprobados({ aprobados: Array(MAX_CODIGOS + 1).fill('1INF25') });

    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/100/);
  });

  test('5.3 rechaza elementos que no son texto', () => {
    expect(validarAprobados({ aprobados: [7] }).error).toBe('cada código debe ser texto');
  });

  test('4.1 y 4.2 rechaza formato inválido sin repetir el valor', () => {
    const r = validarAprobados({ aprobados: ['1INF30<script>'] });

    expect(r.ok).toBe(false);
    expect(r.error).not.toContain('<script>');
  });

  test('2.1 rechaza códigos inexistentes nombrándolos', () => {
    expect(validarAprobados({ aprobados: ['1INF99', 'ZZZ999'] }).error).toBe('códigos inexistentes: 1INF99, ZZZ999');
  });
});
