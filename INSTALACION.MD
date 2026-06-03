# Para instalar las dependencias usar

npm run instalar

Al ejecutar "npm run instalar" se instalan automáticamente todas las dependencias necesarias para ejecutar el proyecto completo.

Esto incluye:

- Backend (Node.js + Oracle):
  Instala dependencias como:
  npm install express cors oracledb dotenv

  Estas permiten crear la API REST y realizar la conexión nativa con Oracle Database.

- Frontend (Ionic + Angular):
  Ejecuta npm install dentro de la carpeta frontend para instalar todas las dependencias necesarias para la aplicación móvil.

- Admin-Web (Angular):
  Ejecuta npm install dentro de la carpeta admin-web para instalar todas las dependencias necesarias para el panel administrativo web.

# Para iniciar el servidor backend usar:

cd backend
node index.js

# Para iniciar la aplicación móvil usar:

cd frontend
ionic serve

# Para iniciar el panel administrativo web usar:

cd admin-web
npm install --legacy-peer-deps
ng serve