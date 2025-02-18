var chat = {};
chat.socket = null;
var pantallaChat;
var contadorPreguntas = 0;


var modal = document.getElementById("modal");
var confirmarBtn = document.getElementById("confirmar");
var cancelarBtn = document.getElementById("cancelar");
var clearButton = document.getElementById("clear");
var logoutButton = document.getElementById("logout");

clearButton.addEventListener("click", function() {
	modal.style.display = "block";
});

confirmarBtn.addEventListener("click", function() {
	modal.style.display = "none";
	if (chat.socket != null) {
		chat.limpiarPreguntas();
		chat.socket.send("Limpiar");
	}
});

cancelarBtn.addEventListener("click", function() {
	modal.style.display = "none";
});

document.getElementById("home").addEventListener("click", function() {
    window.location.href = "index.html"; 
});


// Función para cerrar sesión (Logout)
logoutButton.addEventListener("click", function() {
    fetch('/logout', {
        method: 'GET',
        credentials: 'include'
    }).then(response => {
        if (response.redirected) {
            window.location.href = response.url; // Redirigir al login
        }
    }).catch(error => console.error('Error:', error));
});

function hayWebSocket() {
	if ('WebSocket' in window)
		return true;
	if ('MozWebSocket' in window)
		return true;
	return false;
}

function getHost() {
	var url = null;
	if (window.location.protocol == 'http:')
		url = 'ws://' + window.location.host + '/chatumar/websocket/index';
	else
		url = 'wss://' + window.location.host + '/chatumar/websocket/index';
	return url;
}

function crearWebSocket(host) {
	var miSocket = null;
	if ('WebSocket' in window)
		miSocket = new WebSocket(host); 
	else if ('MozWebSocket' in window)
		miSocket = new MozWebSocket(host);
	if (miSocket.readyState != miSocket.CLOSED)
		return miSocket;
	return null;
}

chat.reportar = function(texto) {
	pantallaChat.escribir(texto);
}

chat.atenderMensajeServer = function(mensajeServer) {
	let indice = mensajeServer.data.split("#")[0];
	let bandera = mensajeServer.data.split("#")[1];
	let mensaje = mensajeServer.data.split("#")[2];
	if(bandera == "false"){
		pantallaChat.escribir(indice, mensaje)
	}
}

chat.configurarSocket = function() {
	if (hayWebSocket() == false) {
		chat.reportar('El sitio no está soportado por este navegador.');
		return;
	}
	var host = getHost();
	chat.socket = crearWebSocket(host);
	if (chat.socket == null) {
		chat.reportar('No fue posible conectarse a ' + host);
		return;
	}
	chat.socket.onopen = function() {
		//chat.reportar('Se ha iniciado la conexión.');
	};
	chat.socket.onclose = function() {
		//chat.reportar('Se ha cerrado la conexión.');
		//chat.socket.onopen();
	}
	chat.socket.onmessage = function(mensaje) {
		chat.atenderMensajeServer(mensaje);
	};
}

chat.iniciar = function() {
	chat.configurarSocket();
}

chat.limpiarPreguntas = function() {
  var preguntas = document.querySelectorAll('#preguntas');
  preguntas.forEach(function(pregunta) {
    pregunta.remove();
  });
};

	
window.addEventListener("click", function(event) {
	if (event.target == modal) {
		modal.style.display = "none";
	}
});	

window.onload = function() {
    pantallaChat = document.getElementById('containerChat');
    pantallaChat.escribir = function(posicion, textoMensaje ) {
    	var div = document.createElement('div');
        div.setAttribute('id', 'preguntas');
        contadorPreguntas++;
        div.style.wordWrap = 'break-word';
       
        /*
        var botonBorrar = document.createElement('button'); 
        botonBorrar.setAttribute('id', 'borrar');
        botonBorrar.innerText = 'Borrar';
        */
        var botonBorrar = document.createElement('span');
        botonBorrar.setAttribute('id', 'borrar');
        botonBorrar.innerText = 'X';

        
        botonBorrar.addEventListener('click', function() {
            //ELIMINAR MENSAJE 
        	div.remove();
            chat.socket.send(posicion+"#delete#"+textoMensaje);
        });
        div.appendChild(botonBorrar);
        
        var mensaje = document.createElement('div');
        mensaje.innerHTML = textoMensaje;
        div.appendChild(mensaje);
        
        //var botonAprobar = document.createElement('button');
        var botonAprobar = document.createElement('span');
        botonAprobar.setAttribute('id', 'aprobar');
        //botonAprobar.innerText = 'Aprobar';
        botonAprobar.addEventListener('click', function() {
           
            //APROBAR MENSAJE
        	div.remove();
        	chat.socket.send(posicion+"#true#"+textoMensaje);
        	
        });
        div.appendChild(botonAprobar);
        
        pantallaChat.appendChild(div);
        
        while (pantallaChat.childNodes.length > 25) {
            pantallaChat.removeChild(pantallaChat.firstChild);
        }
        pantallaChat.scrollTop = pantallaChat.scrollHeight;
    }
    /*
    var clearButton = document.getElementById('clear');
    clearButton.addEventListener('click', function() {
        if (chat.socket != null) {
        	if (confirm('¿Estás seguro de que deseas limpiar las preguntas?')) {
                chat.limpiarPreguntas();
                chat.socket.send("Limpiar");
            }
        }
    });*/
    chat.iniciar();
}

