# Diseño: Cursos habilitados

## Visión general

`POST /habilitados` recibe `{ "aprobados": [<códigos>] }`, valida la entrada antes de tocar los datos y devuelve los cursos habilitados calculados en memoria sobre `src/data/repositorio.js`. No se agregan dependencias de producción.

## Componentes

| Componente | Responsabilidad |
| --- | --- |
| `src/data/repositorio.js` | Sin cambios de contrato. Se reutiliza `listar()` y `obtener(codigo)`. |
| `src/validacion/aprobados.js` | Función pura `validarAprobados(body)` que devuelve `{ ok: true, codigos: Set }` o `{ ok: false, error }`. Concentra los requisitos 2, 3.1, 4.1, 4.2 y 5. |
| `src/servicios/habilitados.js` | Función pura `calcularHabilitados(aprobados: Set)` que recorre `repositorio.listar()` una vez. Requisito 1. |
| `src/routes/habilitados.js` | Router Express: valida, calcula y responde. No lee el JSON directamente. |
| `src/middleware/errores.js` | Manejador de errores final: traduce errores de `express.json` (400 / 413) y cualquier otro error a 500 genérico. Requisitos 3.2, 4.3 y 4.4. |
| `src/app.js` | `express.json({ limit: '10kb' })`, monta `/cursos` y `/habilitados`, y registra el manejador de errores al final. |

## Contrato

`POST /habilitados` con `Content-Type: application/json`

```json
{ "aprobados": ["1INF25", "1INF27", "1INF49"] }
```

Respuesta `200`, arreglo en el orden de `data/cursos.json`:

```json
[{ "id": "1INF30", "name": "Programación 3", "credits": 5.0, "cycle": 6, "type": "obligatorio" }]
```

## Algoritmo

1. Validar el cuerpo (orden: existe `aprobados` → es arreglo → longitud ≤ 100 → cada elemento es texto → cada elemento cumple `^[A-Z0-9]{6}$` → cada código existe).
2. Convertir la lista a `Set` (elimina repetidos).
3. Filtrar `repositorio.listar()`: `!aprobados.has(c.id) && c.prerequisites.every((p) => aprobados.has(p))`.
4. Proyectar cada curso a `{ id, name, credits, cycle, type }`.

Complejidad: O(n · r) con n = 87 cursos y r = requisitos por curso; la entrada está acotada a 100 elementos antes de cualquier recorrido, así que el costo por solicitud es constante en la práctica.

## Decisiones sobre casos que el pedido no define

| # | Caso | Decisión | Razón |
| --- | --- | --- | --- |
| D1 | Lista vacía `[]` | 200 con los cursos sin requisitos (1.4). | Es un caso real: un alumno que recién entra al ciclo 5 no tiene cursos aprobados de esta malla. Rechazarlo obligaría a la página a tratarlo aparte. |
| D2 | Código con formato válido pero inexistente (`1INF99`) | 400 nombrando el código (2.1). | Un error de tipeo ignorado en silencio produce una lista equivocada con 200, que es el mismo daño del hallazgo 3. Como el código ya pasó la validación de formato, nombrarlo en el mensaje no refleja contenido peligroso. |
| D3 | Códigos repetidos | Se aceptan y se deduplican (1.6). | No cambian el resultado y rechazar sería castigar un error inofensivo del cliente. Cuentan para el límite de 100 porque el límite protege el costo de recorrer la entrada. |
| D4 | Tope de 100 elementos | 400 si hay más de 100 (3.1). | La malla tiene 87 cursos: una lista legítima nunca supera 87. 100 deja margen sin permitir listas como la de 5 000 del hallazgo 1. |
| D5 | Tope de 10 KB del cuerpo | `express.json({ limit: '10kb' })`, 413 si se excede (3.2). | 100 códigos de 6 caracteres con comillas y comas ocupan ~1 KB. 10 KB corta el problema antes de parsear JSON grandes, que es donde se bloquea el event loop. 413 es el código estándar para cuerpo demasiado grande. |
| D6 | Minúsculas (`1inf25`) | 400 por formato. | Todos los códigos del catálogo están en mayúsculas. Normalizar ocultaría errores y amplía la superficie de entrada; la página puede convertir a mayúsculas antes de enviar. |
| D7 | Mensaje de error de formato | Genérico, sin eco del valor: `"aprobados contiene códigos con formato inválido"` (4.2). | El hallazgo 2 muestra que la entrada maliciosa se refleja. No repetir el valor elimina el riesgo de XSS reflejado en clientes que muestren el mensaje. |
| D8 | Orden de la respuesta | Orden de `data/cursos.json` (ciclo y luego código) (1.5). | Es estable, predecible para los tests y coincide con `GET /cursos`. |
| D9 | Forma de la respuesta | Arreglo plano, igual que `GET /cursos`. | Consistencia con la API existente; el total se obtiene con `length`. |
| D10 | Electivos (`cycle: null`) | Se incluyen si cumplen requisitos. | El pedido habla de "cursos" sin excluir electivos y el alumno también los matricula. |
| D11 | Elementos no texto, `null`, objeto | 400 (5.3). | Evita conversiones implícitas (`String(obj)`) que podrían dar resultados falsos con 200. |
| D12 | Propiedades extra en el cuerpo | Se ignoran. | No afectan el cálculo; rechazarlas rompería clientes que agreguen metadatos. |

## Manejo de errores

| Caso | Respuesta | Requisito |
| --- | --- | --- |
| Sin `aprobados` | `400 { "error": "aprobados es obligatorio" }` | 5.2 |
| `aprobados` no es arreglo | `400 { "error": "aprobados debe ser una lista de códigos" }` | 5.1 |
| Más de 100 elementos | `400 { "error": "aprobados admite como máximo 100 códigos" }` | 3.1 |
| Elemento no texto | `400 { "error": "cada código debe ser texto" }` | 5.3 |
| Formato inválido | `400 { "error": "aprobados contiene códigos con formato inválido" }` | 4.1, 4.2 |
| Código inexistente | `400 { "error": "códigos inexistentes: 1INF99" }` | 2.1 |
| JSON mal formado | `400 { "error": "JSON inválido" }` | 4.4 |
| Cuerpo > 10 KB (incluye la lista de 5 000 códigos) | `413 { "error": "solicitud demasiado grande" }` | 3.2, 3.3 |
| Cualquier otro error | `500 { "error": "error interno" }`, el detalle solo va a `console.error` | 4.3 |

## Estrategia de pruebas

- `tests/habilitados.test.js`: supertest sobre `src/app.js`, al menos un test por criterio 1.1 a 5.3. El 3.1 mide el tiempo con `Date.now()`. El 3.3 envía 5 000 códigos y espera 413; el 3.4 lanza en paralelo esa solicitud y `GET /health`.
- `tests/errores.test.js`: monta una ruta que lanza una excepción sobre una app de prueba con el mismo middleware para provocar el 500 de 4.3.
- `tests/validacion.test.js` y `tests/servicios.test.js`: pruebas unitarias de las funciones puras.
- Cobertura: `coverageThreshold.global.lines = 80` en `jest.config.js` (requisito 7.1).

## Quality y security gates

Los gates corren en `.github/workflows/ci.yml`. El workflow se dispara en `pull_request` hacia `main`, en `push` a `main` y en `push` a cualquier otra rama, para que el feedback llegue antes de abrir el PR.

| Gate | Requisito | Herramienta y umbral | Bloquea / avisa | Etapa | Razón |
| --- | --- | --- | --- | --- | --- |
| Pruebas y cobertura (`test`) | 7.1 | `jest --coverage` con `coverageThreshold.global.lines: 80` | **Bloquea** | Pull request y `main` (también push a ramas) | Es la política de TI literal. Corre en el PR porque es donde el autor todavía puede corregir barato; se repite en `main` porque un merge puede combinar dos PR que pasaban por separado. |
| SCA (`sca`) | 6.1 | `npm audit --audit-level=high` (todas las dependencias, prod y dev) | **Bloquea** con alta o crítica; moderadas y bajas solo **avisan** (quedan en el log, el job no falla) | Pull request y `main` (también push a ramas) | La política prohíbe alta y crítica, así que el umbral es `high`. Se incluye dev porque las herramientas de build y test corren en el runner de CI con acceso al código. Bloquear moderadas generaría ruido frecuente sin fix disponible y empujaría a desactivar el gate. Corre también en `main` porque aparecen CVE nuevos sobre dependencias que ayer estaban limpias. Se evaluó y descartó `--omit=dev` en el paso bloqueante (ver `TRAZABILIDAD.md`, cambios a la propuesta de Kiro): la política de TI dice *ninguna* dependencia, sin excepción para dev. |
| Detección de secretos (`secretos`) | 6.2 | gitleaks 8.21.2, `gitleaks git` sobre **todo el historial** (`fetch-depth: 0`), umbral: 1 hallazgo no registrado en `.gitleaksignore` | **Bloquea** | Pull request y `main` (también push a ramas) | Un secreto filtrado no tiene "nivel aceptable": la política dice ninguno. Se escanea el historial completo y no solo el diff porque borrar el archivo en un commit nuevo no saca la clave del historial. La salida es con `--redact` para que el log del run no vuelva a exponer la clave. Un falso positivo o una clave ya rotada se registra en `.gitleaksignore` con su razón. |
| SAST (`sast`, extra) | — | CodeQL `javascript-typescript`, suite `security-extended` | **Avisa** (publica alertas en *Security → Code scanning*, el job no falla por hallazgos) | Pull request y `main` | El proyecto es pequeño y CodeQL produce falsos positivos en código Express (por ejemplo, rutas sin rate limit). Mientras no haya una línea base revisada, bloquear frenaría merges por hallazgos no explotables. El plan es pasarlo a bloqueante para severidad alta cuando la línea base esté en cero. |

### Por qué el secreto existente se registra en `.gitleaksignore`

`config/ejemplo.env` venía con `CATALOGO_API_KEY` en el commit inicial `7506fec`. La clave se considera comprometida: se reemplaza por un marcador en el archivo, se rota en el proveedor y su huella (`commit:archivo:regla:línea`) se registra en `.gitleaksignore` con un comentario. Reescribir el historial no es opción porque la rama ya fue publicada y la clave ya debe tratarse como filtrada.
