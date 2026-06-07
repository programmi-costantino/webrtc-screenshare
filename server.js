const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

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
http.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});
