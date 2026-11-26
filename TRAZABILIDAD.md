# Trazabilidad

Spec: [`.kiro/specs/habilitados/`](.kiro/specs/habilitados/). Pipeline: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Runs usados como evidencia (rama `claude/optimistic-hopper-j29b2j`, el workflow corre en push a cualquier rama, en PR a `main` y en push a `main`):

| Run | Commit | Resultado |
| --- | --- | --- |
| [#1](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898260900) | `8aacabe` ci: gates | test ✗ (cobertura 64,7 %), sca ✗ (lodash 4.17.20, alta), secretos ✗ (`generic-api-key` en `config/ejemplo.env`), sast ✓ |
| [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) | `c201cd5` tests de habilitados | test ✗ (23 de 44 tests en rojo: `POST /habilitados` no existía y respondía 404; cobertura 72 %), sca ✗, secretos ✗ |
| [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) | `4e1fd73` implementación | test ✓ (58 tests, cobertura 83 %), sca ✗, secretos ✗ |
| [#4](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898414772) | `e1aa16e` lodash 4.18.1 | sca ✓, secretos ✗ |
| [#5](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898437768) | `8891221` clave retirada y registrada | todos ✓ |

## Requisito → gate → evidencia

### Requisitos verificados por gates del pipeline

| Requisito | Gate (herramienta y umbral) | Bloquea / avisa | Etapa | Run fallido | Run corregido |
| --- | --- | --- | --- | --- | --- |
| 6.1 SI `npm audit` reporta una vulnerabilidad alta o crítica, EL pipeline DEBE fallar en `sca` | `npm audit --audit-level=high` (prod + dev) | Bloquea alta/crítica; moderadas y bajas avisan | PR y `main` | [#1](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898260900) (lodash 4.17.20: GHSA-35jh-r3h4-6jhm y otras, alta) | [#4](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898414772) (lodash 4.18.1, 0 vulnerabilidades) |
| 6.2 SI gitleaks detecta un secreto no registrado en `.gitleaksignore`, EL pipeline DEBE fallar en `secretos` | gitleaks 8.21.2, `gitleaks git` sobre todo el historial, umbral 1 hallazgo | Bloquea | PR y `main` | [#1](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898260900) (huella `7506fec:config/ejemplo.env:generic-api-key:4`) | [#5](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898437768) (clave retirada y rotada, huella en `.gitleaksignore`) |
| 7.1 SI la cobertura de líneas es menor a 80 %, EL pipeline DEBE fallar en `test` | `jest --coverage` con `coverageThreshold.global.lines: 80` | Bloquea | PR y `main` | [#1](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898260900) (64,7 %) | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) (83 %) |
| Extra SAST | CodeQL `security-extended` | Avisa (alertas en Code scanning) | PR y `main` | — (sin hallazgos que provoquen falla: el gate no bloquea por diseño) | [#1](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898260900) en adelante ✓ |

**Diagnóstico del run rojo de secretos.** El checkout usa `fetch-depth: 0` y gitleaks escanea los 10 commits del historial, por eso detecta la clave del commit inicial aunque ya no esté en el árbol actual. Borrar la línea en un commit nuevo no basta (el run seguiría en rojo); la corrección válida es tratar la clave como comprometida, rotarla y registrar solo esa huella en `.gitleaksignore` con su razón. Con el modo "solo commits del push" el run habría salido verde sin ver la clave, por eso se eligió historial completo.

### Requisitos verificados por tests (job `test`, que bloquea en PR y `main`)

La evidencia de falla es el run [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018): los tests se subieron antes de la implementación y fallaron porque `POST /habilitados` no existía. La corrección es el run [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311).

| Requisito | Test que lo verifica | Falla antes de la corrección | Pasa después |
| --- | --- | --- | --- |
| 3.1 Más de 100 elementos → 400 en < 500 ms | `tests/habilitados.test.js` › "3.1 más de 100 elementos responde 400 en menos de 500 ms"; `tests/validacion.test.js` › "3.1 rechaza más de 100 elementos" | [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 3.2 Cuerpo > 10 KB → 413 | `tests/habilitados.test.js` › "3.2 un cuerpo mayor a 10 KB responde 413" | [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) (respondía 404 tras parsear 5 000 códigos) | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 3.3 `/health` responde en < 500 ms durante una solicitud de 5 000 códigos | `tests/habilitados.test.js` › "3.3 mientras se atiende una solicitud de 5 000 códigos…" | No hay run rojo: en [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) ya pasaba porque la ruta no existía (404 inmediato). Es una prueba de regresión; lo que impide el bloqueo son 3.1 y 3.2, que sí fallaron en #2 | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 4.1 Formato inválido (`1INF30<script>`) → 400 | `tests/habilitados.test.js` › "4.1 un código con formato inválido responde 400" y "4.1 rechaza el código …" | [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 4.2 El error no refleja la entrada | `tests/habilitados.test.js` › "4.2 el error de formato no refleja el texto recibido"; `tests/validacion.test.js` › "4.1 y 4.2 rechaza formato inválido sin repetir el valor" | El test de ruta pasó en [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) de forma trivial (404 sin cuerpo con la entrada); la falla real la da el test unitario, que no podía correr sin `src/validacion/aprobados.js` | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 4.3 Error no controlado → 500 `{ "error": "error interno" }` sin stack ni rutas | `tests/errores.test.js` › "4.3 un error no controlado responde 500…" | `src/middleware/errores.js` entró en la parte guiada (commit `233d5fc`), antes del primer run, así que no hay run rojo. Sin ese middleware Express responde con su página HTML de error, que incluye el stack cuando `NODE_ENV` no es `production` (el hallazgo 2) | [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) y [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 4.4 JSON mal formado → 400 sin stack | `tests/habilitados.test.js` › "4.4 un cuerpo que no es JSON válido…" | Igual que 4.3, sin run rojo. Verificado a mano: con `src/app.js` del commit base (sin middleware) el test falla (`expected { error }`, recibe HTML con stack) | [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) y [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 5.1 `aprobados` como texto → 400 | `tests/habilitados.test.js` › "5.1 aprobados como texto responde 400" | [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 5.2 Sin `aprobados` → 400 | `tests/habilitados.test.js` › "5.2 sin la propiedad aprobados responde 400" | [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |
| 5.3 Elemento no texto → 400 | `tests/habilitados.test.js` › "5.3 un elemento no texto … responde 400" | [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) | [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311) |

Requisitos funcionales (1.1 a 1.6 y 2.1) también tienen al menos un test cada uno en `tests/habilitados.test.js`, `tests/servicios.test.js` y `tests/validacion.test.js`, todos en rojo en [#2](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898319018) y en verde en [#3](https://github.com/DivanoPerezNina/INF384-lab6-base/actions/runs/45898383311).

## Cambios a la propuesta de Kiro

> Completar con la revisión real que haga Kiro sobre el spec (ver el prompt de revisión entregado aparte). Cada fila: qué propuso Kiro, qué se cambió y por qué.

| Documento | Qué propuso Kiro | Qué cambiaste | Por qué |
| --- | --- | --- | --- |
| | | | |
| | | | |
