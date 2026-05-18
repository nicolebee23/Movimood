# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

## Backend local para TMDB

La app ya no consulta TMDB directamente desde React. Ahora usa un endpoint PHP en `api/tmdb-discover.php` para que la clave quede del lado del servidor.

Configuración local:

1. Deja la clave en `.env` como `TMDB_API_KEY`.
2. Define `REACT_APP_API_BASE_URL=http://localhost/movimood-frontend/api` en local o `https://movimood.plandecine.com/api` en producción.
3. Sirve la carpeta desde XAMPP para que el endpoint PHP responda.
4. Si cambias `.env`, reinicia `npm start` o vuelve a ejecutar `npm run build`.

Endpoint usado por el frontend:

- `GET /api/tmdb-discover.php`

El endpoint acepta solo los parámetros necesarios para `discover/movie` y añade la API key en el servidor.

## Recuperacion de password por email

La recuperacion de contrasena ya funciona en local, pero para envio real de emails debes configurar un proveedor.

Configuracion recomendada (Resend):

1. En tu `.env` agrega:
	- `MAIL_FROM=MoviMood <onboarding@resend.dev>`
	- `RESEND_API_KEY=re_xxxxxxxxx`
2. Reinicia Apache (XAMPP).
3. Prueba la recuperacion desde `/recuperar-password`.

Notas:

- Si `RESEND_API_KEY` existe, el backend envia por API de Resend.
- Si no existe, hace fallback a `mail()` de PHP (normalmente no funcional en XAMPP sin SMTP).
- La respuesta del endpoint incluye `mailSent` y `mailProvider` para diagnostico rapido.

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
