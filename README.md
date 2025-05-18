# 📚 Sistema de Gestión Escolar – Frontend (Angular)

Este proyecto corresponde al **frontend** del sistema de gestión parcial de un colegio. Está construido con **Angular 18** y proporciona la interfaz para que administradores, docentes, estudiantes y tutores gestionen y visualicen información académica y administrativa.

---

## 🚀 Características principales

Este sistema permite realizar operaciones clave como:

- Inicio y cierre de sesión para distintos roles (Administrador, Docente, Estudiante, Tutor).
- Administración de usuarios y datos académicos.
- Gestión de asistencia, tareas, exámenes, participación y matrículas.
- Generación de reportes en PDF/Excel.
- Visualización de predicciones mediante aprendizaje automático (ML).
- Interfaz responsive y moderna con integración de **Flowbite** (Tailwind) y **SweetAlert2**.

## 🛠️ Tecnologías utilizadas

- **Angular 18**
- **TypeScript**
- **Tailwind CSS + Flowbite**
- **SweetAlert2** (alertas y modales)
- **jsPDF + AutoTable** (para generar PDFs)
- **XLSX** (para exportar a Excel)
- **FileSaver.js** (descargas en navegador)
- **RxJS** (gestión reactiva)
- **Router de Angular** (navegación entre vistas)

---

## ⚙️ Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/sistema-gestion-escolar-frontend.git
   cd sistema-gestion-escolar-frontend
    ```
2. Instala las dependencias necesarias:
    ```bash
    npm install
    ```
3. Ejecuta la aplicación en modo desarrollo:
    ```bash
    ng serve
    ```
3. Accede a la aplicación web en:
    ```bash
    http://localhost:4200
    ```