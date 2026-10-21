# Backend de cotizaciones DINSA

El servidor sirve el sitio estático y recibe el formulario en `POST /api/cotizaciones`. Las solicitudes se envían a `luisrocha.v.340@gmail.com`; el correo del cliente se usa como dirección de respuesta. Se acepta un archivo opcional de hasta 10 MB.

## Requisitos

- Node.js 20 o posterior.
- Una cuenta de correo que permita enviar por SMTP y sus credenciales SMTP.

## Configuración local

Desde la carpeta `backend`:

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` a `.env`.
3. Sustituye `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM` por los valores de la cuenta SMTP. No compartas ni publiques el archivo `.env`.
4. Inicia el servidor con `npm start`.
5. Abre `http://localhost:3000`.

Usa el puerto seguro que indique el proveedor SMTP; normalmente 465 con `SMTP_SECURE=true` o 587 con `SMTP_SECURE=false`. Algunos proveedores requieren una contraseña de aplicación.

## Despliegue

Despliega la carpeta `backend` en un servicio que soporte Node.js 20+, configura las mismas variables SMTP como variables privadas del servicio y ejecuta `npm start`. El servicio debe exponer el puerto definido por `PORT`. El backend también sirve los archivos estáticos del sitio desde la carpeta raíz del proyecto, por lo que el dominio puede apuntar directamente a este servicio.

Si el sitio se aloja en otro dominio/servicio, habrá que configurar CORS y cambiar el destino de la petición `fetch` en `contact-form.js`.

El endpoint limita las solicitudes, valida los campos, permite únicamente extensiones de archivo conocidas y procesa adjuntos en memoria; no escribe archivos cargados al disco.
