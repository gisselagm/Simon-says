// index.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Inicialización de Express y creación del servidor HTTP
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Cuando un cliente se conecta...
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  // Estado del juego para este socket
  socket.sequence = [];

  // Función para agregar un color aleatorio a la secuencia
  function addColor() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    socket.sequence.push(randomColor);
  }

  // Función para iniciar la siguiente ronda
  function startRound() {
    addColor();
    // Enviamos la secuencia completa al cliente
    socket.emit('sequence', socket.sequence);
  }

  // Evento para iniciar el juego (cuando el cliente presiona "Iniciar Juego")
  socket.on('startGame', () => {
    console.log('Juego iniciado para', socket.id);
    socket.sequence = []; // reiniciamos la secuencia
    startRound();
  });

  // Recibimos la secuencia que ingresó el usuario para validarla
  socket.on('userInput', (userSequence) => {
    console.log('Secuencia del usuario:', userSequence);
    let isCorrect = true;
    // Comparamos cada posición de la secuencia del usuario con la secuencia generada
    for (let i = 0; i < userSequence.length; i++) {
      if (userSequence[i] !== socket.sequence[i]) {
        isCorrect = false;
        break;
      }
    }
    // Si la secuencia es correcta y se completó, se inicia la siguiente ronda
    if (isCorrect && userSequence.length === socket.sequence.length) {
      socket.emit('result', { correct: true });
      // Se espera un instante y se inicia la siguiente ronda
      setTimeout(() => {
        startRound();
      }, 1000);
    } else {
      // Si la secuencia es incorrecta, se notifica el fallo y se termina el juego
      socket.emit('result', { correct: false });
      socket.sequence = [];
    }
  });

  // Cuando el cliente se desconecta...
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
