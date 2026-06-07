const express = require('express');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io'); 

const app = express();

// Serve i file statici dalla cartella 'public' (Disponibile per entrambi i server)
app.use(express.static('public'));

// --- CONFIGURAZIONE SSL ---
const options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/fullchain.pem')
};

// --- CREAZIONE DEI DUE SERVER ---
const httpsServer = https.createServer(options, app);
const httpServer = http.createServer(app);

// --- CONFIGURAZIONE SOCKET.IO ---
const io = new Server();

// Agganciamo Socket.io a ENTRAMBI i server
io.attach(httpsServer);
io.attach(httpServer);

io.on('connection', (socket) => {
    console.log('Un utente si è connesso:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Utente ${socket.id} entrato nella stanza: ${roomId}`);
        
        // NOVITÀ: Invia l'ID esatto del nuovo spettatore a chi sta condividendo
        socket.to(roomId).emit('peer-joined', socket.id);
    });

    // NOVITÀ: Inoltro mirato. Usiamo 'targetId' invece di 'roomId'
    // Il server passa i pacchetti video solo al destinatario corretto
    socket.on('offer', (targetId, description) => {
        socket.to(targetId).emit('offer', socket.id, description);
    });

    socket.on('answer', (targetId, description) => {
        socket.to(targetId).emit('answer', socket.id, description);
    });

    socket.on('candidate', (targetId, candidate) => {
        socket.to(targetId).emit('candidate', socket.id, candidate);
    });

    socket.on('disconnect', () => {
        console.log('Utente disconnesso:', socket.id);
        
        // NOVITÀ: Avvisa tutti gli altri che questo utente se n'è andato, 
        // così i loro browser chiudono la connessione dedicata ed evitano blocchi
        socket.broadcast.emit('peer-left', socket.id);
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