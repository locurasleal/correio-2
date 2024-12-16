const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(express.json()); // Para manejar el cuerpo de las solicitudes POST

// Conexión a MongoDB
const mongoUrl = 'mongodb://localhost:27017'; // URL de conexión a MongoDB
const dbName = 'correiodenatal';  // Nombre de tu base de datos
let db;

// Establecer la conexión a MongoDB y guardarla en `app.locals.db`
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log('Conectado a la base de datos');
    db = client.db(dbName);  // Conexión a la base de datos
    app.locals.db = db;      // Guardar la base de datos en `app.locals` para usarla en las rutas
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
  });

// Función para permitir CORS
const allowCors = (fn) => async (req, res) => {
  const allowedOrigins = ['https://www.natalhoteispires.com.br', 'http://localhost:3000'];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.join(', '));
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  return await fn(req, res);
};

// Handler para guardar el mensaje
const handler = async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Base de datos no disponible' });
    }

    console.log('Datos recibidos:', req.body);

    const { senderHotel, senderName, recipientHotel, recipientName, customMessage } = req.body;

    // Validación de datos
    if (!senderHotel || !senderName || !recipientHotel || !recipientName || !customMessage) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (typeof senderHotel !== 'string' || typeof recipientHotel !== 'string' || typeof senderName !== 'string' || typeof recipientName !== 'string' || typeof customMessage !== 'string') {
      return res.status(400).json({ error: 'Los datos deben ser cadenas de texto válidas' });
    }

    // Inserción de mensaje en la base de datos
    const messages = db.collection('suporte');

    const newMessage = {
      senderHotel,
      senderName,
      recipientHotel,
      recipientName,
      customMessage,
      created_at: new Date(),
    };

    const result = await messages.insertOne(newMessage);

    res.json({ message: 'Mensaje guardado exitosamente', id: result.insertedId });
  } catch (err) {
    console.error('Error al guardar el mensaje:', err);
    res.status(500).json({ error: 'Error al guardar el mensaje', details: err.message });
  }
};

// Ruta para guardar el mensaje
app.post('/save-message', allowCors(handler));

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});

