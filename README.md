# Mi Web Personal

Página personal creada con HTML, CSS y JavaScript para mostrar información sobre mí, mis intereses y enlaces principales.

## Descripción

Esta web funciona como portfolio personal y presenta:

- una introducción sobre mí
- información de formación e intereses
- enlaces a Spotify, GitHub y LinkedIn
- contacto, feedback y chatbot con IA del centro

## Tecnologías utilizadas

- HTML
- CSS
- JavaScript
- Node.js
- Express

## Cómo ejecutar el proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la clave de la IA

Copia el archivo `.env.example` a `.env` y añade tu clave real del centro:

```bash
cp .env.example .env
```

En el archivo `.env`:

```env
SIMARRO_API_KEY=sk-tu_clave_real_aqui
PORT=3000
ALLOW_INSECURE_SSL=true
```

> Si el certificado del centro es autofirmado, deja `ALLOW_INSECURE_SSL=true`.

### 3. Iniciar el servidor

```bash
npm start
```

La aplicación quedará disponible en:

```text
http://localhost:3000
```

El chatbot usa el endpoint:

```text
POST /api/chat
```

## Estructura principal

- `index.html`: página principal
- `style.css`: estilos
- `script.js`: lógica del sitio y chatbot
- `server.js`: backend proxy para la API del centro

## Autor

David Pino

## Enlaces

- GitHub: https://github.com/Davidpino19
- LinkedIn: https://www.linkedin.com/in/david-pino-144042327/
- Spotify: https://open.spotify.com/user/davidpino
- Letterboxd: https://letterboxd.com/davidpino19/
