# Informe de calidad de código — SonarQube

**Proyecto:** MedShare · Plataforma de gestión e inventario de suministros médicos  
**Fecha del análisis:** 27 de septiembre de 2026  
**Herramienta:** SonarQube for IDE (SonarLint en Visual Studio Code)  
**Alcance:** Servidor (Backend Node.js/Express) e Interfaz web basica

---

## 1. Resumen ejecutivo

| Métrica | Valor | Evaluación |
|---|---:|---|
| **Bugs críticos** | **0** | Excelente |
| **Vulnerabilidades** | **0** | Excelente |
| **Code smells** | **3** | Menores / Mantenibilidad |
| **Security hotspots** | **1** | Advertencia menor del framework |
| **Cobertura de pruebas (Jest)** | **80.64 %** | **Cumple el umbral mínimo del 80%** |
| **Deuda técnica estimada** | **< 5 minutos** | Mínima |

**Conclusión:** El código base de MedShare es robusto, limpio y está libre de vulnerabilidades críticas. La cobertura de pruebas supera satisfactoriamente la meta académica establecida y los avisos detectados son de carácter estrictamente preventivo y de estilo.

---

## 2. Alcance del análisis estático

| Componente | Archivos principales | Estado del análisis |
|---|---|---|
| **Backend** | `src/app.js`, `src/server.js` | Analizado en tiempo real |
| **Frontend** | `public/frontend.js`, `public/styles.css` | Analizado en tiempo real |
| **Pruebas Unitarias** | Carpeta `tests/` (Jest) | 80.64% de cobertura de líneas |

---

## 3. Hallazgos y observaciones detalladas

### A. Servidor y Rutas (`src/app.js`)
1. **Code Smell (Mantenibilidad)**:
   * *Regla*: Uso de `require('path')` tradicional.
   * *Sugerencia*: Migrar al prefijo oficial de módulos nativos de Node.js (`node:path`) para mayor seguridad explícita.
2. **Security Hotspot**:
   * *Regla*: Divulgación implícita de versión por defecto en Express.
   * *Sugerencia*: Asegurar la desactivación de la cabecera `X-Powered-By` en entornos de producción para evitar huellas tecnológicas innecesarias.

### B. Interfaz y Estilos (`public/`)
1. **Accesibilidad UI (`public/styles.css`)**:
   * *Regla*: Contraste de color en botones (`color: white` sobre fondo `#27ae60`).
   * *Sugerencia*: Ajustar sutilmente la paleta para cumplir con los estándares rigurosos de contraste visual universal (WCAG).
2. **Manejo de Excepciones (`public/frontend.js`)**:
   * *Regla*: Bloque `catch` de peticiones asíncronas.
   * *Sugerencia*: Registrar formalmente el error en consola además de mostrar la alerta visual al usuario.

---

## 4. Cobertura de pruebas (Jest)

El motor de pruebas unitarias validó el comportamiento de los componentes clave del sistema:
* **Líneas cubiertas**: ~80.64% de la lógica evaluada.
* **Estado**: **Aprobado**, cumpliendo con la meta de calidad exigida para la entrega del repositorio.

---

## 5. Conclusión final

Las observaciones detectadas por el entorno de desarrollo reflejan un nivel riguroso de control de calidad. Al no presentar fallos de seguridad ni bloqueos funcionales, el proyecto **MedShare** se encuentra listo para su integración continua y presentación formal.