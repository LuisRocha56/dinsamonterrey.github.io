# Backend de cotizaciones DINSA

El servidor redirige la página principal a `frontend/index.html` y recibe el formulario en `POST /api/cotizaciones`. Envía las solicitudes a `luisrocha.v.340@gmail.com` mediante la API HTTPS de Resend; el correo del cliente se usa como dirección de respuesta. Se acepta un archivo opcional de hasta 20 MB.

## Requisitos

- Node.js 20 o posterior.
- Una cuenta de Resend con una API key.
- Un dominio verificado en Resend para la dirección remitente.

## Configuración local

Desde la carpeta `backend`:

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` a `.env`.
3. Sustituye `RESEND_API_KEY` por una API key de Resend y `RESEND_FROM` por un remitente de un dominio que hayas verificado en Resend. No compartas ni publiques el archivo `.env`.
4. Inicia el servidor con `npm start`.
5. Abre `http://localhost:3000`.

Para pruebas iniciales, Resend permite usar `onboarding@resend.dev` como remitente, pero restringe los destinatarios a la dirección asociada a tu cuenta. Para enviar a `luisrocha.v.340@gmail.com`, verifica un dominio propio en Resend y utiliza una dirección de ese dominio como `RESEND_FROM`.

## Despliegue

Despliega el repositorio en un servicio que soporte Node.js 20+, configura `RESEND_API_KEY` y `RESEND_FROM` como variables privadas del servicio, establece `backend` como directorio raíz y ejecuta `npm start`. El servicio debe exponer el puerto definido por `PORT`. La página principal del sitio se encuentra en `frontend/index.html`.

Si el sitio se aloja en otro dominio/servicio, habrá que configurar CORS y cambiar el destino de la petición `fetch` en `contact-form.js`.

El endpoint limita las solicitudes, valida los campos, permite únicamente extensiones de archivo conocidas y procesa adjuntos en memoria; no escribe archivos cargados al disco.
