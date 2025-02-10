const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware para procesar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Crear un router para manejar rutas específicas
const router = express.Router();

// Rutas principales
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        res.redirect('/admin.html');
    } else {
        res.send('Credenciales incorrectas. <a href="/login">Intentar de nuevo</a>');
    }
});


// Usar el router para todas las rutas
app.use('/', router);

// Conexiones WebSocket y almacenamiento de mensajes
const conexiones = new Set();
const mensajesAnteriores = [];
let indice = 1;

wss.on('connection', (ws) => {
    conexiones.add(ws);
    console.log('Cliente conectado');

    // Enviar mensajes anteriores al nuevo cliente
    mensajesAnteriores.forEach((msg) => {
        ws.send(msg);
    });

    ws.on('message', (message) => {
        message = message.toString();

        if (message === 'Limpiar') {
            mensajesAnteriores.length = 0;
            indice = 1;
            publicarGlobalmente(message);
        } else {
            const partes = message.split('#');
            if (partes.length === 2) {
                message = `${indice}#${message}`;
            }

            mensajesAnteriores.push(message);
            indice++;

            if (partes[1] === 'true' || partes[1] === 'delete') {
                const pos = mensajesAnteriores.findIndex((m) =>
                    m.split('#')[0] === partes[0] && m.split('#')[1] === 'false'
                );
                if (pos !== -1) {
                    mensajesAnteriores.splice(pos, 1);
                }
            }

            publicarGlobalmente(message);
        }
    });

    ws.on('close', () => {
        conexiones.delete(ws);
        console.log('Cliente desconectado');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Función para enviar mensajes a todos los clientes
function publicarGlobalmente(msg) {
    conexiones.forEach((conexion) => {
        if (conexion.readyState === WebSocket.OPEN) {
            conexion.send(msg);
        }
    });
}

// Iniciar el servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
