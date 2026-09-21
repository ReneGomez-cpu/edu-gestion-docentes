# EduGestión

Sistema web institucional para administrar y consultar información docente. Permite mantener un directorio académico con asignaciones, filtros, roles de acceso y datos centralizados en Firebase.

## Enlaces

- Aplicación publicada: https://centro-escolar-36970.web.app/
- Repositorio: https://github.com/ReneGomez-cpu/edu-gestion-docentes

## Tecnologías

- HTML5, CSS3 y JavaScript con módulos ES.
- Firebase Authentication con acceso por correo y contraseña.
- Cloud Firestore como base de datos.
- Firebase Hosting para la publicación.

## Arquitectura

```text
src/
├── components/       # Formulario docente, interfaz y componentes reutilizables
├── services/         # Firebase, autenticación, Firestore y reglas de negocio
├── styles/           # Estilos responsivos de la aplicación
└── main.js           # Rutas, vistas y eventos de la interfaz
firebase/
└── firestore.rules   # Reglas de autorización de Firestore
```

La aplicación usa el SDK modular de Firebase. La configuración pública del proyecto se concentra en `src/services/firebaseConfig.js`; no se incluyen contraseñas, tokens privados ni claves de servidor en el repositorio.

## Modelo de datos

### Colección `teachers`

Cada documento representa un docente:

```text
{
  id: "UUID",
  name: "María Carmen",
  code: "DOC-2026-01",
  specialty: "Matemáticas",
  phone: "7123-4567",
  needsEquipment: "No",
  status: "Activo",
  active: true,
  notes: "",
  assignments: [
    {
      grade: "7.º",
      section: "B",
      subject: "Matemáticas",
      shift: "Matutino"
    }
  ],
  updatedAt: "fecha ISO"
}
```

### Colección `users`

El ID del documento debe coincidir exactamente con el UID de Firebase Authentication.

```text
{
  name: "Nombre del usuario",
  role: "admin" | "user",
  active: true
}
```

## Roles y seguridad

| Rol | Puede consultar fichas | Registrar / editar / desactivar docentes | Gestionar usuarios |
|---|---:|---:|---:|
| `admin` | Sí | Sí | Sí |
| `user` | Sí | No | No |

Las reglas de Firestore exigen que toda cuenta tenga un documento activo en `users/{UID}`. Solo el rol `admin` puede crear o actualizar documentos en `teachers`. Los usuarios autorizados pueden consultar, pero la base de datos rechaza cambios no permitidos.

## Funcionalidades

- Inicio y cierre de sesión con Firebase Authentication.
- Dashboard con total de docentes, asignaciones, necesidades de equipo y distribución por turno.
- Registro, edición y ficha individual de docentes.
- Varias asignaciones académicas por docente.
- Eliminación de asignaciones sin eliminar al docente.
- Desactivación lógica de docentes: conserva el documento y las asignaciones en Firestore, pero lo excluye del directorio y métricas activas.
- Vista administrativa de docentes inactivos, con búsqueda, filtros y acción de reactivación.
- Estado activo/inactivo para conservar el historial institucional.
- Directorio con búsqueda por nombre, código, especialidad, grado, sección, asignatura o turno.
- Filtro por turno matutino o vespertino.
- Roles de administrador y usuario autorizado; las acciones de gestión se ocultan a usuarios de consulta.
- Interfaz adaptable a escritorio, tablet y teléfono.

## Validaciones implementadas

- Nombre, identificador, especialidad, teléfono y campos de asignación obligatorios.
- Identificador institucional único; se bloquean códigos duplicados.
- Teléfono salvadoreño de ocho dígitos, con formato `7123-4567` o `71234567`.
- Las observaciones son opcionales.
- Mensajes comprensibles ante datos inválidos, permisos insuficientes o errores de conexión.
- Firestore impide que un usuario con rol `user` guarde cambios aunque intente hacerlo desde la interfaz.
- La interfaz oculta los botones de registro y edición al rol `user`; este rol conserva el acceso de lectura a la ficha individual.

## Configuración de Firebase

1. Crear o seleccionar el proyecto Firebase `centro-escolar-36970`.
2. En **Authentication**, habilitar el proveedor **Email/Password**.
3. En **Firestore Database**, crear la colección `users`.
4. Por cada usuario creado en Authentication, agregar `users/{UID}` con `name`, `role` y `active: true`.
5. Publicar las reglas de `firebase/firestore.rules`.
6. Confirmar que `src/services/firebaseConfig.js` tenga la configuración de la aplicación web del proyecto.

## Ejecución local

No abrir `index.html` directamente con doble clic. Se requiere un servidor local:

```powershell
cd ruta\del\proyecto
py -3 -m http.server 5173
```

Luego abrir http://127.0.0.1:5173.

## Publicación

```powershell
firebase deploy --only hosting --project centro-escolar-36970
```

## Pruebas realizadas

| Escenario | Resultado |
|---|---|
| Inicio de sesión como administrador | Correcto |
| Registro de docente | Correcto |
| Edición y persistencia en Firestore | Correcto |
| Docentes en turnos matutino y vespertino | Correcto |
| Búsqueda y filtro por turno | Correcto |
| Código institucional duplicado | Rechazado |
| Teléfono con más de ocho dígitos | Rechazado |
| Asignación sin grado | Rechazada |
| Observaciones vacías | Permitidas (campo opcional) |
| Usuario autorizado intenta guardar cambios | Rechazado por reglas de Firestore |
| Usuario autorizado consulta ficha individual | Correcto, sin opciones de edición |
| Botón Cancelar en formulario docente | Correcto, cierra sin guardar |
| Desactivación de docente como administrador | Correcto, confirma la acción y conserva el documento en Firestore |
| Vista de docentes inactivos | Correcto, disponible solo para administrador |
| Reactivación de docente | Correcto, conserva datos y asignaciones y lo devuelve al directorio activo |

## Próximas mejoras

- Agregar pruebas automatizadas.
- Incorporar recuperación de contraseña y verificación de correo.
