# Requisitos: Cursos habilitados

## Introducción

Funcionalidad para que un alumno envíe la lista de cursos que ya aprobó y reciba los cursos que puede llevar en la matrícula 2027-1. Se expone como `POST /habilitados` sobre los datos de `data/cursos.json`.

Los requisitos 3 a 5 nacen de los hallazgos de la revisión de seguridad del prototipo anterior (hallazgos 1, 2 y 3). Los requisitos 6 y 7 vienen de la política de TI para todo cambio que llega a `main`.

## Glosario

- **Código de curso**: texto de exactamente 6 caracteres entre `A-Z` y `0-9` (por ejemplo `1INF30`, `INF275`). Es el formato de todos los `id` de `data/cursos.json`.
- **Curso habilitado**: curso que no está en `aprobados` y cuyos `prerequisites` están todos dentro de `aprobados`. Un curso sin requisitos está habilitado.

## Requisitos

### Requisito 1: Consultar cursos habilitados

**Historia de usuario:** Como alumno, quiero enviar los cursos que ya aprobé, para saber qué cursos puedo llevar.

#### Criterios de aceptación

1.1 CUANDO se envíe `POST /habilitados` con `{ "aprobados": ["1INF25", "1INF27", "1INF49"] }`, EL sistema DEBE responder 200 con un arreglo de 27 cursos que incluye `1INF29`, `1INF30`, `1INF31` y `1INF32`.

1.2 CUANDO se envíe `POST /habilitados` con una lista válida, EL sistema DEBE excluir de la respuesta todo curso cuyo código esté en `aprobados`.

1.3 CUANDO se envíe `POST /habilitados` con una lista válida, EL sistema DEBE excluir de la respuesta todo curso que tenga al menos un requisito fuera de `aprobados`.

1.4 CUANDO se envíe `POST /habilitados` con `{ "aprobados": [] }`, EL sistema DEBE responder 200 con exactamente los cursos cuyo `prerequisites` está vacío.

1.5 CUANDO se envíe `POST /habilitados` con una lista válida, EL sistema DEBE devolver cada curso con los campos `id`, `name`, `credits`, `cycle` y `type`, en el mismo orden en que aparecen en `data/cursos.json`.

1.6 CUANDO `aprobados` contenga códigos repetidos, EL sistema DEBE responder 200 con el mismo resultado que si cada código apareciera una sola vez.

### Requisito 2: Códigos inexistentes

**Historia de usuario:** Como alumno, quiero que el sistema me avise si escribí mal un código, para no recibir una lista equivocada.

#### Criterios de aceptación

2.1 SI `aprobados` contiene un código con formato válido que no existe en `data/cursos.json` (por ejemplo `1INF99`), EL sistema DEBE responder 400 con `{ "error": "<mensaje>" }` y el mensaje DEBE nombrar ese código.

### Requisito 3 (seguridad, hallazgo 1): Tamaño de la solicitud

**Historia de usuario:** Como responsable del servicio, quiero rechazar solicitudes desproporcionadas, para que una sola solicitud no deje el servicio sin responder.

#### Criterios de aceptación

3.1 SI `aprobados` tiene más de 100 elementos, EL sistema DEBE responder 400 con `{ "error": "<mensaje>" }` en menos de 500 ms, medido desde que se envía la solicitud hasta que llega la respuesta.

3.2 SI el cuerpo de la solicitud supera 10 KB, EL sistema DEBE responder 413 con `{ "error": "<mensaje>" }` sin procesar la lista.

3.3 MIENTRAS se atiende una solicitud de 5 000 códigos, EL sistema DEBE responder `GET /health` con 200 en menos de 500 ms.

### Requisito 4 (seguridad, hallazgo 2): Formato de códigos y errores sin detalles internos

**Historia de usuario:** Como responsable del servicio, quiero que una entrada maliciosa no revele detalles internos, para no dar información útil a un atacante.

#### Criterios de aceptación

4.1 SI algún elemento de `aprobados` no cumple el formato de código de curso (por ejemplo `1INF30<script>`), EL sistema DEBE responder 400 con `{ "error": "<mensaje>" }`.

4.2 SI la respuesta es un error 400 por formato, EL cuerpo NO DEBE contener el texto recibido sin validar (por ejemplo `<script>`).

4.3 SI ocurre un error no controlado durante una solicitud, EL sistema DEBE responder 500 con exactamente `{ "error": "error interno" }`, sin las palabras `stack`, `at ` ni rutas de archivo (`/src/`, `\src\`).

4.4 SI el cuerpo de la solicitud no es JSON válido, EL sistema DEBE responder 400 con `{ "error": "<mensaje>" }` sin stack trace.

### Requisito 5 (seguridad, hallazgo 3): Tipo de la entrada

**Historia de usuario:** Como alumno, quiero que el sistema rechace una entrada mal formada, para no recibir resultados incorrectos con un 200.

#### Criterios de aceptación

5.1 SI `aprobados` no es un arreglo (por ejemplo `{ "aprobados": "1INF25" }`), EL sistema DEBE responder 400 con `{ "error": "<mensaje>" }`.

5.2 SI el cuerpo no contiene la propiedad `aprobados`, EL sistema DEBE responder 400 con `{ "error": "<mensaje>" }`.

5.3 SI algún elemento de `aprobados` no es de tipo texto (por ejemplo `123`, `null` u objeto), EL sistema DEBE responder 400 con `{ "error": "<mensaje>" }`.

### Requisito 6 (seguridad, política de TI): Dependencias y secretos

**Historia de usuario:** Como área de TI, quiero que el pipeline frene cambios inseguros, para que nada vulnerable o con secretos llegue a `main`.

#### Criterios de aceptación

6.1 SI `npm audit` reporta al menos una vulnerabilidad de severidad alta o crítica en cualquier dependencia (de producción o de desarrollo), EL pipeline DEBE fallar en el job `sca`.

6.2 SI gitleaks detecta un secreto en cualquier commit del historial del repositorio que no esté registrado en `.gitleaksignore`, EL pipeline DEBE fallar en el job `secretos`.

### Requisito 7 (calidad): Cobertura de pruebas

**Historia de usuario:** Como equipo, quiero que la cobertura no baje, para que cada cambio llegue probado.

#### Criterios de aceptación

7.1 SI la cobertura de líneas de `src/` (sin `src/server.js`) medida por `jest --coverage` es menor a 80 %, EL pipeline DEBE fallar en el job `test`.
