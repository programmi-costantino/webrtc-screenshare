const express = require('express');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io'); // Importiamo il modulo Server di socket.io

const app = express();

// Serve i file statici dalla cartella 'public' (Disponibile per entrambi i server)
app.use(express.static('public'));

// --- CONFIGURAZIONE SSL ---
const options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/fullchain.pem')
};

// --- CREAZIONE DEI DUE SERVER ---
// Creiamo sia il server HTTPS che quello HTTP, passando a entrambi la stessa app Express
const httpsServer = https.createServer(options, app);
const httpServer = http.createServer(app);

// --- CONFIGURAZIONE SOCKET.IO ---
const io = new Server();

// Agganciamo Socket.io a ENTRAMBI i server!
// Chi entra sulla 3030 e chi sulla 3031 parleranno allo stesso gestore di WebSocket
io.attach(httpsServer);
io.attach(httpServer);

io.on('connection', (socket) => {
    console.log('Un utente si è connesso:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Utente ${socket.id} entrato nella stanza: ${roomId}`);
        socket.to(roomId).emit('peer-joined');
    });

    socket.on('offer', (roomId, description) => {
        socket.to(roomId).emit('offer', description);
    });

    socket.on('answer', (roomId, description) => {
        socket.to(roomId).emit('answer', description);
    });

    socket.on('candidate', (roomId, candidate) => {
        socket.to(roomId).emit('candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('Utente disconnesso:', socket.id);
    });
});

// --- AVVIO DEI SERVER SULLE RISPETTIVE PORTE ---
const HTTPS_PORT = 3030;
httpsServer.listen(HTTPS_PORT, () => {
    console.log(`[SSL] Server WebRTC in ascolto su HTTPS (Porta ${HTTPS_PORT})`);
});

const HTTP_PORT = 3031;
httpServer.listen(HTTP_PORT, () => {
    console.log(`[CHIARO] Server WebRTC in ascolto su HTTP (Porta ${HTTP_PORT})`);
});