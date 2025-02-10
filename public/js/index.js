var pantallaChat,
modal = document.getElementById("myModal"),
user = localStorage.getItem("user"),
school = localStorage.getItem("school");

var chat = {};
chat.socket = null;
var pantallaChat;
let bandera = false;

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
		url = 'ws://' + window.location.host + '/index';
	else
		url = 'wss://' + window.location.host + '/index';
	return url;
}
/*
function getHost() {
    return 'ws://localhost:8080';
}
*/

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

function inputsTienenDatos() {
	  var userValue = document.getElementById("user").value;
	  var schoolValue = document.getElementById("school").value;
	  return userValue !== "" && schoolValue !== "";
	}

	// Función para enviar los datos
	function enviarDatos() {
	  if (inputsTienenDatos()) {
	    var userValue = document.getElementById("user").value;
	    var schoolValue = document.getElementById("school").value;
	    localStorage.setItem("user", userValue);
	    localStorage.setItem("school", schoolValue);
	    modal.style.display = "none";
	  }
	}
	
chat.reportar = function(texto) {
	pantallaChat.escribir(texto);
}

chat.configurarCajaMensaje = function() {
	document.getElementById('mensaje').onkeydown = function(event) {
		if (event.keyCode == 13) {
			event.preventDefault();
			chat.enviarMensaje();
		}
	};
}

chat.terminarChat = function() {
	document.getElementById('mensaje').onkeydown = null;
	chat.reportar('Se ha cerrado la conexión.<br>Favor de recargar tu navegador');
}


chat.limpiarPreguntas = function() {
	  var preguntas = document.querySelectorAll('#preguntas');
	  preguntas.forEach(function(pregunta) {
	    pregunta.remove();
	  });
	};
	
	
chat.atenderMensajeServer = function(mensajeServer) {
	if(mensajeServer.data == "Limpiar"){
		chat.limpiarPreguntas();
	}else{
		let indice = mensajeServer.data.split("#")[0];
		let bandera = mensajeServer.data.split("#")[1];
		let mensaje = mensajeServer.data.split("#")[2];
		if (bandera == "true") {
			pantallaChat.escribir(mensaje)
		}
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
		chat.reportar('Se mostrarán únicamente las preguntas aprobadas por el administrador.');
		chat.configurarCajaMensaje();
	};
	chat.socket.onclose = function() {
		chat.terminarChat();
		//borrarDatosLocalStorage()
	}
	chat.socket.onmessage = function(mensaje) {
		chat.atenderMensajeServer(mensaje);
	};
}

chat.iniciar = function() {
	chat.configurarSocket();
}

document.getElementById('enviar').addEventListener('click', function(event) {
	chat.enviarMensaje();
});

chat.enviarMensaje = function() {
	var textoMensaje = document.getElementById('mensaje').value;
	if (textoMensaje != '') {
		chat.socket.send("false#" + user + " (" + school + "):<br>" +  textoMensaje);
		document.getElementById('mensaje').value = '';
	}
}


window.onload = function() {
	if (user !== null && school !== null) {
	    modal.style.display = "none";
	  } else {
	    modal.style.display = "block";
	  }
	pantallaChat = document.getElementById('containerChat');
		pantallaChat.escribir = function(textoMensaje) {
		var div = document.createElement('div');
		div.setAttribute('id', 'preguntas');
		div.style.wordWrap = 'break-word';
		div.innerHTML = textoMensaje;
		pantallaChat.appendChild(div);
		while (pantallaChat.childNodes.length > 25) {
			pantallaChat.removeChild(pantallaChat.firstChild);
		}
		pantallaChat.scrollTop = pantallaChat.scrollHeight;
  }
  chat.iniciar();
}


function borrarDatosLocalStorage() {
  localStorage.removeItem("user");
  localStorage.removeItem("school");
}
