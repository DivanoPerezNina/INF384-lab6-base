# Plan de implementación: Cursos habilitados

- [x] 1. Manejo de errores sin detalles internos y límite de cuerpo
  - Crear `src/middleware/errores.js` (400 JSON inválido, 413 cuerpo grande, 500 genérico)
  - Configurar `express.json({ limit: '10kb' })` y registrar el middleware al final de `src/app.js`
  - Tests en `tests/errores.test.js` para 3.2, 4.3 y 4.4
  - _Requisitos: 3.2, 4.3, 4.4_

- [x] 2. Validación de la entrada
  - Crear `src/validacion/aprobados.js` con `validarAprobados(body)`
  - Tests unitarios en `tests/validacion.test.js`
  - _Requisitos: 2.1, 3.1, 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 3. Cálculo de cursos habilitados
  - Crear `src/servicios/habilitados.js` con `calcularHabilitados(aprobados)` usando `src/data/repositorio.js`
  - Tests unitarios en `tests/servicios.test.js`
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 4. Ruta `POST /habilitados`
  - Crear `src/routes/habilitados.js` y montarlo en `src/app.js`
  - Tests con supertest en `tests/habilitados.test.js`, uno o más por criterio
  - _Requisitos: 1.1–1.6, 2.1, 3.1, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 5. Gate de cobertura
  - `coverageThreshold.global.lines: 80` en `jest.config.js` y `npm test -- --coverage` en CI
  - _Requisitos: 7.1_

- [ ] 6. Gate de SCA
  - Job `sca` con `npm audit --audit-level=high`
  - Corregir la dependencia vulnerable (`lodash`)
  - _Requisitos: 6.1_

- [ ] 7. Gate de detección de secretos
  - Job `secretos` con gitleaks sobre todo el historial
  - Retirar la clave de `config/ejemplo.env`, rotarla y registrar su huella en `.gitleaksignore`
  - _Requisitos: 6.2_

- [ ] 8. Gate de SAST (extra)
  - Job `sast` con CodeQL en modo aviso

- [ ] 9. Trazabilidad
  - Completar `TRAZABILIDAD.md` con requisito → gate/test → run fallido y run corregido
