# Prompt para Kiro (modo Spec, modelo Auto)

Pegar en el chat de Kiro con el modo **Spec** seleccionado:

---

Lee los steering files de `.kiro/steering/` y el spec completo de `.kiro/specs/habilitados/` (requirements.md, design.md y tasks.md). El código ya está implementado en `src/` y las pruebas en `tests/`; el pipeline está en `.github/workflows/ci.yml` y la evidencia en `TRAZABILIDAD.md`.

Quiero que actúes como revisor del spec, no como implementador. **No modifiques ningún archivo.** Haz lo siguiente:

1. Revisa cada criterio de aceptación de `requirements.md` contra las cuatro reglas de EARS verificable: condición que se puede provocar en un test, respuesta observable (código HTTP, campo, valor o tiempo con número), un solo comportamiento y sin adjetivos sin medida. Lista los criterios que no cumplan alguna regla y propone su redacción corregida en EARS (CUANDO / SI / MIENTRAS … EL sistema DEBE …).
2. Contrasta `requirements.md` con estos tres hallazgos de seguridad y dime si alguno queda sin cubrir o cubierto de forma débil:
   - Una lista de 5 000 códigos dejó el servicio sin responder 40 segundos.
   - El código `1INF30<script>` produjo un 500 con stack trace y la ruta `C:\apps\malla\src\...`.
   - `{"aprobados": "1INF25"}` respondió 200 con resultados incorrectos.
3. Revisa la tabla de decisiones (D1 a D12) de `design.md` y propone las decisiones que tú habrías tomado distinto, con su razón.
4. Revisa la sección "Quality y security gates" de `design.md` y `ci.yml`: para el gate de SCA (npm audit) y el de secretos (gitleaks) indica qué umbral, modo (bloquea o avisa) y etapa (pull request o main) propondrías tú, y por qué.
5. Verifica que cada criterio de aceptación tenga al menos un test en `tests/` y lista los que no.

Entrega el resultado como una tabla con las columnas: `Documento | Sección o criterio | Propuesta de Kiro | Razón`. Al final, una lista corta de las 3 propuestas que consideras más importantes.

---

## Qué hacer con la respuesta

1. Lee la tabla de Kiro y decide qué aceptas y qué no.
2. Elige **dos** propuestas concretas que cambies (o que rechaces con una razón técnica) y regístralas en `TRAZABILIDAD.md`, sección "Cambios a la propuesta de Kiro", con: qué propuso Kiro, qué cambiaste y por qué.
3. Si aceptas alguna, aplícala tú en el spec (y en el código o tests si corresponde), corre `npm test -- --coverage` y haz commit y push.
4. Revisa en el chat de Kiro cuántos créditos gastó el prompt.

## Plan B si no quedan créditos

Mismo prompt en GitHub Copilot Chat (VS Code), empezando por: "Lee .kiro/specs/habilitados/ y .kiro/steering/ y …".
