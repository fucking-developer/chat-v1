require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Cargar variables de entorno
const PORT = process.env.PORT || 8080;
const SECRET_KEY = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY === 'true';
const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE, 10) || 3600000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

const router = express.Router();
// Middleware para verificar JWT en cookies
const verificarToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ authenticated: false, message: "No hay token" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Guarda la info del usuario en la request
        next(); // Permite continuar con la siguiente función
    } catch (err) {
        return res.status(401).json({ authenticated: false, message: "Token inválido o expirado" });
    }
};


// Ruta principal
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de login (GET)
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta de autenticación (POST)
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generar token JWT
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: TOKEN_EXPIRATION });

        // Guardar token en una cookie segura
        res.cookie('token', token, { 
            httpOnly: COOKIE_HTTP_ONLY, 
            secure: COOKIE_SECURE, 
            maxAge: COOKIE_MAX_AGE 
        });

        return res.json({ success: true, redirect: "/admin" });
    } else {
        res.send('Credenciales incorrectas. <a href="/login">Intentar de nuevo</a>');
    }
});

// Ruta de logout (cierra sesión)
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Ruta protegida (requiere autenticación)
router.get('/admin', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
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
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
