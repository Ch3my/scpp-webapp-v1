# SCPP Tauri

Cliente para SCPP en Tauri (multiplataforma) con React y ShadCN. Utilizamos el plugin de Rust HTTP para hacer las request al server para evitar CORS

Guarda datos de la session en el localstorage

## Descripción General

Esta aplicación proporciona una solución integral para el seguimiento de gastos personales, gestión de inventario de alimentos y almacenamiento de documentos importantes. Cuenta con una interfaz de usuario responsiva construida con React y bibliotecas de componentes modernos, con un backend en Tauri para la integración con el escritorio.

## Características

### Dashboard
- Ver y filtrar transacciones financieras por rango de fechas, categoría y términos de búsqueda
- Visualizar patrones de gastos a través de múltiples tipos de gráficos:
  - Tendencias de gastos mensuales
  - Desglose por categorías
  - Porcentajes de uso
  - Resúmenes anuales
  - Visualización radial de categorías
- Añadir nuevas transacciones financieras

### Gestión de Almacenamiento de Alimentos
- Seguimiento de alimentos con cantidades y unidades
- Registro de transacciones de alimentos (adiciones/retiros)
- Editar y eliminar elementos de alimentos
- Ver historial de transacciones

### Gestión de Assets
- Almacenar y ver documentos importantes como imágenes
- Categorizar y describir Assets
- Eliminar Assets cuando ya no sean necesarios

### Autenticación y Configuración
- Sistema de inicio de sesión
- Puntos finales de API configurables
- Gestión de sesiones

## Stack Tecnológico

### Frontend
- **React**: Biblioteca de UI
- **React Router**: Navegación
- **Shadcn UI**: Biblioteca de componentes (Card, Button, Dialog, etc.)
- **Lucide React**: Biblioteca de iconos
- **Luxon**: Manejo de fechas/horas
- **Numeral.js**: Formateo de números
- **Recharts** (implícito): Visualizaciones de gráficos

### Integración con Backend
- **Tauri**: Framework de aplicaciones de escritorio
- **Plugin HTTP**: Comunicación con API

## Estructura del Proyecto

El proyecto sigue una arquitectura basada en componentes con varias pantallas principales:

- **Login.tsx**: Autenticación de usuario
- **Config.tsx**: Configuración de la aplicación
- **Dashboard.tsx**: Vista general financiera principal
- **FoodScreen.tsx**: Gestión de inventario de alimentos
- **Assets.tsx**: Gestión de documentos/activos
- **Htas.tsx**: Pantalla de opciones/herramientas

## Primeros Pasos

### Requisitos Previos
- Node.js
- Rust (para Tauri)

### Instalación
1. Clonar el repositorio
2. Instalar dependencias:
   ```
   npm install
   ```
3. Ejecutar en modo desarrollo:
   ```
   npm run tauri dev
   ```

### Compilación para Producción
```
npm run tauri build
```

## Configuración de API

La configuración de la API se gestiona a través de la pantalla de Configuración con:
- Prefijo API: URL base para la API
- ID de Sesión: Token de autenticación

## Uso

1. **Configuración inicial**:
   - Configurar el punto final API en la pantalla de Configuración
   - Iniciar sesión con tus credenciales

2. **Dashboard**:
   - Ver transacciones financieras
   - Filtrar por rango de fechas, categoría o términos de búsqueda
   - Añadir nuevas transacciones usando el botón "+"
   - Revisar gráficos para obtener información financiera

3. **Almacenamiento de Alimentos**:
   - Añadir elementos de alimentos con unidades
   - Registrar transacciones (compras, consumo)
   - Monitorear niveles de inventario

4. **Activos**:
   - Subir y categorizar documentos importantes
   - Ver imágenes de documentos
   - Eliminar documentos obsoletos