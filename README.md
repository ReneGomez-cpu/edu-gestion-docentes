# EduGestión — Firebase con SDK modular

La aplicación carga el SDK modular de Firebase desde `src/services/firebase.js`.
La única configuración del proyecto está en `src/services/firebaseConfig.js`; no debe duplicarse en `index.html`.

## Cómo ejecutarla

No abras `index.html` directamente con doble clic (`file://`). Ejecútala mediante un servidor web local o publícala en Firebase Hosting. Cualquier servidor estático funciona.

## Firebase

Los SDK cargados son:
- Firebase App
- Firebase Authentication
- Cloud Firestore

La configuración de Firebase corresponde al proyecto `centro-escolar-36970`.

Para que un usuario pueda registrar o editar docentes, su documento
`users/{UID}` debe tener `active: true` y `role: "admin"`. Las reglas de
Firestore que aplican esa protección se encuentran en `firebase/firestore.rules`
y deben publicarse en Firebase Console si aún no se han desplegado.

## Importante para iniciar sesión

El usuario debe existir en **Firebase Authentication > Email/Password** y también debe tener un documento en Firestore en:

`users/{UID}`

Ejemplo:

```text
name: "Administrador"
role: "admin"
active: true
```

El `UID` del documento debe ser exactamente el mismo UID del usuario creado en Firebase Authentication.
