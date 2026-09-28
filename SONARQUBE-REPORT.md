# Informe de calidad de código — SonarQube

**Proyecto:** MedShare · Plataforma de gestión e inventario de suministros médicos  
**Fecha del análisis:** 27 de septiembre de 2026  
**Herramienta:** SonarQube for IDE (SonarLint en Visual Studio Code)  
**Alcance:** Servidor (Backend Node.js/Express), Interfaz web y Pruebas Unitarias

---

## 1. Alcance y Estado del Análisis por Componente

| Componente | Archivos analizados | Hallazgos detectados |
|---|---|---|
| **Backend** | `src/app.js`, `src/server.js` | 2 observaciones (Importación de módulo y cabeceras de Express) |
| **Frontend** | `public/frontend.js`, `public/styles.css` | 2 observaciones (Contraste visual y manejo de excepciones) |
| **Pruebas Unitarias** | `tests/insumos.test.js` | **0 hallazgos (Código limpio y sin advertencias)** |

---

## 2. Hallazgos y Observaciones Detalladas

### A. Servidor y Rutas (`src/app.js`)
1. **Code Smell (Mantenibilidad)**:
   * *Regla*: Uso de `require('path')` tradicional.
   * *Sugerencia*: Migrar al prefijo oficial de módulos nativos de Node.js (`node:path`) para mayor seguridad explícita.
2. **Security Hotspot**:
   * *Regla*: Divulgación implícita de versión por defecto en Express.
   * *Sugerencia*: Asegurar la desactivación de la cabecera `X-Powered-By` en entornos de producción.

### B. Interfaz y Estilos (`public/`)
1. **Accesibilidad UI (`public/styles.css`)**:
   * *Regla*: Contraste de color en botones (`color: white` sobre fondo `#27ae60`).
   * *Sugerencia*: Ajustar sutilmente la paleta para cumplir con los estándares rigurosos de contraste visual universal (WCAG).
2. **Manejo de Excepciones (`public/frontend.js`)**:
   * *Regla*: Bloque `catch` de peticiones asíncronas.
   * *Sugerencia*: Registrar formalmente el error en consola además de mostrar la alerta visual al usuario.

### C. Pruebas Unitarias (`tests/`)
* **Estado**: El archivo `insumos.test.js` se encuentra completamente optimizado. La herramienta no detectó ningún *code smell*, vulnerabilidad ni mala práctica de sintaxis.

---

## 3. Cobertura de Pruebas (Jest)
* **Líneas cubiertas**: ~80.64% de la lógica evaluada.
* **Estado**: **Aprobado**, cumpliendo satisfactoriamente con la meta de calidad exigida para la entrega del repositorio.

---

## 4. Conclusión final
Las observaciones detectadas son de carácter puramente preventivo y de estilo en los archivos de aplicación e interfaz, mientras que los scripts de prueba se mantienen impecables. El proyecto **MedShare** cuenta con bases sólidas y está listo para su integración continua y presentación formal.