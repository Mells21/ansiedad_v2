# Sistema de Tamizaje de Ansiedad

Base inicial para construir una aplicacion inspirada en tu diseno de Figma, organizada por `features` y con estilos compartidos reutilizables.

## Estructura

```text
src/
  app/
    layouts/
    router/
    styles/
  shared/
    components/
    models/
    services/
  features/
    auth/
      components/
      controllers/
      models/
      services/
      views/
    psychologist/
      components/
      controllers/
      models/
      services/
      views/
    student/
      components/
      controllers/
      models/
      services/
      views/
    admin/
      components/
      controllers/
      models/
      services/
      views/
```

## Criterio de organizacion

- `app`: configuracion global, router, layouts y estilos base.
- `shared`: piezas reutilizables en toda la aplicacion.
- `features`: cada modulo funcional aislado por dominio.
- `views`: pantallas de cada feature.
- `controllers`: logica de presentacion con hooks.
- `services`: acceso a API, almacenamiento o integraciones.
- `models`: tipos, interfaces y contratos.
- `components`: piezas internas de la feature.

## Siguiente paso sugerido

1. Conectar cada `service` a un backend real.
2. Crear la feature `screening` para el test psicologico.
3. Crear la feature `students` para fichas, historial y seguimiento.
4. Crear la feature `alerts` para riesgo moderado y alto.
5. Reemplazar datos mock por API y autenticacion real.
