const express = require('express');
const fs = require('fs');       // Modulo nativo per leggere i file dal disco
const https = require('https'); // Modulo HTTPS al posto di HTTP
const app = express();

// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// -------------------------------------------------------------------
// ATTENZIONE: Sostituisci questi percorsi con quelli reali in cui
// Certbot (o il programma che hai usato) ha salvato i tuoi certificati
// -------------------------------------------------------------------
const options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/fullchain.pem')
};

// Crea il server HTTPS passando le opzioni (i certificati) e l'app Express
const server = https.createServer(options, app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Un utente si è connesso:', socket.id);

    // L'utente entra in una stanza specifica usando il codice
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Utente ${socket.id} entrato nella stanza: ${roomId}`);
        
        // Avvisa gli altri membri della stanza che un nuovo utente è entrato
        socket.to(roomId).emit('peer-joined');
    });

    // Inoltra i dati di signaling SOLO a chi è nella stessa stanza
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

const PORT = 3030;
server.listen(PORT, () => {
    console.log(`Server HTTPS in ascolto in modo sicuro sulla porta ${PORT}`);
});