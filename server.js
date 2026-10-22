const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const apiKey = process.env.SIMARRO_API_KEY;

if (process.env.ALLOW_INSECURE_SSL === 'true' || process.env.ALLOW_INSECURE_SSL === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  const message = req.body && typeof req.body.message === 'string' ? req.body.message.trim() : '';
  const model = req.body && typeof req.body.model === 'string' ? req.body.model : 'simarro/Qwen38-DualSpark-medium';

  if (!message) {
    return res.status(400).json({ error: 'Falta el mensaje del usuario.' });
  }

  if (!apiKey || apiKey === 'tu_clave_real_aqui') {
    return res.status(500).json({
      error: 'La clave de la IA del centro no está configurada. Añade SIMARRO_API_KEY en el archivo .env.'
    });
  }

  try {
    const response = await fetch('https://ia.simarro/llmapi/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Eres David Pino, estudiante de 1º de DAM en el IES Simarro. Responde en español como si fueras él, con tono natural, cercano y profesional. Habla en primera persona sobre su experiencia, formación, interés por la tecnología, el deporte, la música y cómo contactarle. No inventes cosas que no estén en su perfil. Si te preguntan por contacto, indica daviidpino19@outlook.es y su perfil de LinkedIn.'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 350
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data && data.error && data.error.message ? data.error.message : 'Error al consultar la IA del centro.';
      return res.status(response.status).json({ error: errorMessage });
    }

    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content.trim() : '';

    if (!reply) {
      return res.status(502).json({ error: 'La IA respondió sin contenido válido.' });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('Error en /api/chat:', error);
    return res.status(502).json({
      error: 'No se pudo conectar con la IA del centro.',
      details: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend funcionando' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Ruta no encontrada.' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor funcionando en http://localhost:${port}`);
});
