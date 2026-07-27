# MiRegistroCPP

Aplicación para digitalizar y centralizar los registros de préstamos y reservaciones
del **Colegio Pedro Palacios**, sustituyendo los formatos físicos utilizados durante
el ciclo escolar.

## Objetivo

Permitir que el personal registre, consulte y administre solicitudes relacionadas
con espacios, mobiliario, equipo y materiales escolares, conservando la información
en un formato ordenado y fácil de consultar.

## Alcance funcional

El sistema contempla cuatro tipos de registro:

1. **Salón de actos**
   - Mobiliario: mesas, sillas, pintarrón, manteles, mamparas y telas.
   - Equipo de sonido: bocinas individuales, micrófonos y sonido completo.
   - Equipo de proyección: pantalla, proyector y computadora.
   - Comestibles y observaciones.

2. **Centro de cómputo**
   - Reserva del espacio por fecha y horario.
   - Registro de la actividad, sección y grado.
   - Observaciones y equipo adicional requerido.

3. **Biblioteca**
   - Reserva del espacio por fecha y horario.
   - Mobiliario: mesas, sillas, manteles, mamparas y telas.
   - Equipo de cómputo: pantalla, proyector, computadora y router.
   - Comestibles y observaciones.

4. **Mobiliario, equipo y materiales**
   - Fecha de solicitud y fecha de entrega.
   - Mobiliario solicitado y cantidad.
   - Equipo solicitado y cantidad.
   - Materiales solicitados y cantidad.
   - Comestibles y observaciones.

## Datos comunes de una solicitud

- Nombre de la persona solicitante.
- Fecha de solicitud o reservación.
- Hora de inicio y hora de fin.
- Actividad a realizar.
- Sección o nivel escolar.
- Grado.
- Recursos solicitados y sus cantidades.
- Observaciones.

## Requisitos funcionales propuestos

- Crear, consultar, editar y cancelar solicitudes.
- Separar los registros por tipo de espacio o préstamo.
- Validar que la fecha y el horario sean correctos.
- Evitar reservaciones simultáneas para un mismo espacio.
- Controlar cantidades para los recursos solicitados.
- Buscar y filtrar por solicitante, fecha, sección, grado y tipo de registro.
- Mostrar el estado de cada solicitud.
- Conservar un historial de préstamos y reservaciones.
- Generar una vista imprimible o un reporte de los registros.

## Estados sugeridos

- Programada
- Aprobada
- Entregada o en uso
- Devuelta o finalizada
- Cancelada

## Reglas de negocio iniciales

- La hora de fin debe ser posterior a la hora de inicio.
- Los recursos que se soliciten por cantidad deben usar números enteros positivos.
- Una reservación no debe traslaparse con otra aprobada para el mismo espacio.
- Las observaciones son opcionales; los datos de la persona solicitante, la fecha,
  el horario y la actividad son obligatorios.
- La disponibilidad de mobiliario y equipo debe verificarse antes de aprobar una
  solicitud.

## Tecnología

La arquitectura, el lenguaje, la base de datos y el proceso de instalación se
documentarán cuando se defina o incorpore la implementación. El nombre del
repositorio se conserva como **MiRegistroCPP**.

## Próximos pasos

- Definir los roles de usuario y el flujo de aprobación.
- Confirmar el inventario disponible de mobiliario y equipo.
- Diseñar el modelo de datos.
- Elegir la tecnología de interfaz, servidor y base de datos.
- Implementar los formularios y las validaciones.
- Agregar pruebas y documentación de instalación.

## Repositorio

<https://github.com/SamuelCan0/MiRegistroCPP>
