/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var ws = new WebSocket('wss://' + location.host + '/one2one');
var videoInput;
var videoOutput;
var webRtcPeer;
//var to;


var registerName = null;
const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;
var registerState = null

window.onload = function() {

	//console = new Console();
	

		setRegisterState(NOT_REGISTERED);
		var drag = new Draggabilly(document.getElementById('videoSmall'));
		videoInput = document.getElementById('videoInput');
		videoOutput = document.getElementById('videoOutput');
		//document.getElementById('name').focus();
/*
		document.getElementById('register').addEventListener('click', function() {
			register();
		});
		document.getElementById('call').addEventListener('click', function() {
			call();
		});
		document.getElementById('terminate').addEventListener('click', function() {
			stop();
		});
		*/
			
		//to=getParameterByName('to');
		//from=getParameterByName('from');
		if (from == '') {
			window.alert("Nos eencuentra al usuario que recibe la llamada");
			return;
		}else{
			console.log('busca al usuario '+from);
			register_user(from);
		}
		
		if (to == '') {
			window.alert("Nos eencuentra al usuario que realiza la llamada");
			return;
		}else{
			console.log('cregistra al usuario '+to);
			busca_user()
			
		}
		
		
		
		

}



function setRegisterState(nextState) {
	switch (nextState) {
	case NOT_REGISTERED:
		$('#register').attr('disabled', false);
		$('#call').attr('disabled', true);
		$('#terminate').attr('disabled', true);
		break;

	case REGISTERING:
		$('#register').attr('disabled', true);
		break;

	case REGISTERED:
		$('#register').attr('disabled', true);
		setCallState(ERROR_CALL);
		break;

	default:
		return;
	}
	registerState = nextState;
}

const ERROR_CALL = 0;
const PROCESSING_CALL = 1;
const IN_CALL = 2;
const END_CALL = 3;
var callState = null

function setCallState(nextState) {
	console.log('nextStae '+nextState)
	switch (nextState) {
	case ERROR_CALL:
		$('#call').attr('disabled', false);
		$('#terminate').attr('disabled', true);
		$('#calling').hide();
		$('#terminate').hide();
		$('#call').show();
		
		$('#controls').hide();
		console.log('--------------------')
		break;

	case PROCESSING_CALL:

	    $('#saludo').html("<span style='font-size:25px;margin:10px'> "+from+"</span><span style='color:#1010A7;font-size:12px'>llamando...</span>");
		$('#call').attr('disabled', true);
		$('#terminate').attr('disabled', true);
		$('#calling').addClass('pulse');
		$('#calling').show();
		$('#terminate').show();
		$('#call').hide(); 
		$('#controls').show();
		 
		break;
	case IN_CALL:
	    $('#usuario_llamar').html("<img title='disponible' height=20px width=20px style='margin-right:10px' src='img/status-available.png' /><b>"+to+" </b><span style='color:#1010A7;font-size:12px'>llamada aceptada</span>" );
		$('#call').attr('disabled', true);
		$('#terminate').attr('disabled', false);
	
		$('#call').hide();

		break;
		
	case END_CALL:
        $('#saludo').html("<span style='font-size:25px;margin:10px'> "+from+"</span><span style='color:green;font-size:12px'>conectado</span>");
		$('#controls').hide();
		   $('#usuario_llamar').html("<img title='disponible' height=20px width=20px style='margin-right:10px' src='img/status-available.png' /><b>"+to+" </b><span style='color:#1010A7;font-size:12px'>llamada finalizada</span>" );
		break;
	default:
		return;
	}
	callState = nextState;
}

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
	case 'registerResponse':
		resgisterResponse(parsedMessage);
		break;
	case 'callResponse':
		callResponse(parsedMessage);
		break;
	case 'incomingCall':
		incomingCall(parsedMessage);
		break;
	case 'startCommunication':
		startCommunication(parsedMessage);
		break;
	case 'stopCommunication':
		console.info("Communication ended by remote peer");
		stop(true);
		break;
	case 'iceCandidate':
		webRtcPeer.addIceCandidate(parsedMessage.candidate)
		break;
	case 'buscaUsuarioResponse':
	usuarioLlamar(parsedMessage)

		break;
	default:
		console.error('Unrecognized message', parsedMessage);
	}
}

window.onbeforeunload = function() {
	ws.close();
}





function resgisterResponse(message) {

	if (message.response == 'accepted') {
		setRegisterState(REGISTERED);
		document.getElementById('saludo').innerHTML = "<span style='font-size:25px;margin:10px'> "+from+"</span><span style='color:green;font-size:12px'>conectado</span>";

	} else {
		setRegisterState(NOT_REGISTERED);
		var errorMessage = message.message ? message.message
				: 'Unknown reason for register rejection.';
		console.log(errorMessage);
		alert('El usuario '+ from+' ya esta conectado en otro dispositivo');
		document.getElementById('saludo').innerHTML = "<span style='font-size:25px;margin:10px'> "+from+"</span><span style='color:#ff8c00;font-size:12px'>ya esta conectado en otro dispositivo</span>";
        $('#acceso').hide();
		
	}
}

function callResponse(message) {
	if (message.response != 'accepted') {
		console.info('Call not accepted by peer. Closing call');
		var errorMessage = message.message ? message.message
				: 'Unknown reason for call rejection.';
		console.log(errorMessage);
		stop(true);
	} else {
		setCallState(IN_CALL);
		webRtcPeer.processAnswer(message.sdpAnswer);
	}
}

function startCommunication(message) {
	setCallState(IN_CALL);
	webRtcPeer.processAnswer(message.sdpAnswer);
}

function incomingCall(message) {
	// If bussy just reject without disturbing user
	if (callState != ERROR_CALL) {
		var response = {
			id : 'incomingCallResponse',
			from : message.from,
			callResponse : 'reject',
			message : 'bussy'

		};
		return sendMessage(response);
	}

	setCallState(PROCESSING_CALL);
	if (confirm('' + message.from
			+ ' le esta llamando.¿Acepta la llmada?')) {
		showSpinner(videoInput, videoOutput);

		var options = {
			localVideo : videoInput,
			remoteVideo : videoOutput,
			onicecandidate : onIceCandidate
		}

		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
				function(error) {
					if (error) {
						console.error(error);
						setCallState(ERROR_CALL);
					}

					this.generateOffer(function(error, offerSdp) {
						if (error) {
							console.error(error);
							setCallState(ERROR_CALL);
						}
						var response = {
							id : 'incomingCallResponse',
							from : message.from,
							callResponse : 'accept',
							sdpOffer : offerSdp
						};
						sendMessage(response);
					});
				});

	} else {
		var response = {
			id : 'incomingCallResponse',
			from : message.from,
			callResponse : 'reject',
			message : 'user declined'
		};
		sendMessage(response);
		stop(true);
	}
}

function register() {
	var name = document.getElementById('name').value;
	if (name == '') {
		window.alert("You must insert your user name");
		return;
	}

	setRegisterState(REGISTERING);

	var message = {
		id : 'register',
		name : name
	};
	sendMessage(message);
	/*document.getElementById('peer').focus();
		var message = {
		id : 'users',
		name : login
	};
	sendMessage(message);*/
}

function register_user() {

	setRegisterState(REGISTERING);
	var message = {
		id : 'register',
		name : from
	};
	sendMessage(message);
	
}
function busca_user() {

	//document.getElementById('peer').focus();
	var message = {
		id : 'buscaUsuario',
		name : to
	};
	sendMessage(message);
}


function call() {
	/*if (document.getElementById('peer').value == '') {
		window.alert("You must specify the peer name");
		return;
	}*/

	setCallState(PROCESSING_CALL);

	showSpinner(videoInput, videoOutput);

	var options = {
		localVideo : videoInput,
		remoteVideo : videoOutput,
		onicecandidate : onIceCandidate
	}

	webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(
			error) {
		if (error) {
			console.error(error);
			setCallState(ERROR_CALL);
		}

		this.generateOffer(function(error, offerSdp) {
			if (error) {
				console.error(error);
				setCallState(ERROR_CALL);
			}
			var message = {
				id : 'call',
				from : from,
				to : to,
				sdpOffer : offerSdp
			};
			sendMessage(message);
		});
	});

}

function stop(message) {

	setCallState(END_CALL);
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;

		if (!message) {
			var message = {
				id : 'stop'
			}
			sendMessage(message);
		}
	}
	hideSpinner(videoInput, videoOutput);
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);
	
	this.waitForConnection(function (){
		ws.send(jsonMessage);
		if(typeof callback !=='undefined'){
			callback();
			}
		},1000);
}
this.waitForConnection = function (callback, interval) {
    if (ws.readyState === 1) {
        callback();
    } else {
        var that = this;
        // optional: implement backoff for interval here
        setTimeout(function () {
            that.waitForConnection(callback, interval);
        }, interval);
    }
};
function onIceCandidate(candidate) {
	console.log('Local candidate' + JSON.stringify(candidate));

	var message = {
		id : 'onIceCandidate',
		candidate : candidate
	}
	sendMessage(message);
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = './img/transparent-1px.png';
		arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = './img/webrtc.png';
		arguments[i].style.background = '';
	}
}
function getParameterByName(name) {
		
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function usuarioLlamar(resp){
	console.log(resp.response)
	console.log(registerState)
	if(registerState>0){
	if(resp.response=="1"){
	document.getElementById("usuario_llamar").innerHTML = "<img title='disponible' height=20px width=20px style='margin-right:10px' src='img/status-available.png' /><b>"+to+
	                                                       " </b><span data-toggle='tooltip' title='llamada de audio' id='call_audio' class='glyphicon glyphicon-earphone' style='cursor:pointer ;color:green;font-size:1em'></span> "+
	                                                        "</b><span data-toggle='tooltip' title='video llamada' id='call' class='fa fa-video-camera' style='cursor:pointer ;color:green;font-size:1em'></span>";
	  $('#icono_llamar').addClass('icono_enable');
      $('#icono_llamar').removeClass('icono_disable');	
		document.getElementById('call').addEventListener('click', function() {
			call();
		});
				document.getElementById('terminate').addEventListener('click', function() {
			stop();
		});
	}else if(resp.response=="2"){
		document.getElementById("usuario_llamar").innerHTML = "<img title='desconectado' height=20px width=20px style='margin-right:10px' src='img/skype-status-dnd.png' /><b>"+to+"</b><i class='glyphicon glyphicon-remove' style='color:red;font-size:1em'  data-toggle='tooltip' title='desconectado'></i> ";
	  }else{
		  document.getElementById("usuario_llamar").innerHTML = "<img title='desconectado' height=20px width=20px style='margin-right:10px' src='img/status-away.png' /><b>"+to+"</b><i class='glyphicon glyphicon-remove' style='color:red;font-size:1em'  data-toggle='tooltip' title='ocupado'></i> ";
		  }
	}
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
});



	$(window).scroll(function() {
		$('#animatedElement').each(function(){
		var imagePos = $(this).offset().top;

		var topOfWindow = $(window).scrollTop();
			if (imagePos < topOfWindow+400) {
				$(this).addClass("slideUp");
			}
		});
	});

function cambia_audio(){

var audio =webRtcPeer.peerConnection.getLocalStreams()[0].getAudioTracks()[0];
console.log('audio: '+audio)
	if(audio.enabled){
		console.log('apaga')
		audio.enabled=false;
		$('#micro').removeClass('fa-microphone');
		$('#micro').addClass('fa-microphone-slash');

	}else{
		console.log('enciendo')
		audio.enabled=true;
		$('#micro').removeClass('fa-microphone-slash');
		$('#micro').addClass('fa-microphone');
	}

}

function cambia_video(){
console.log('cambia')
var video =webRtcPeer.peerConnection.getLocalStreams()[0].getVideoTracks()[0];
console.log('video: '+video)
	if(video.enabled){
		video.enabled=false;
		$('#cam').removeClass('fa-video-camera');
		$('#cam').addClass('disable_cam');
	}else{

		video.enabled=true;
		$('#cam').addClass('fa-video-camera');
		$('#cam').removeClass('disable_cam');
	}

}


// Event listener for the full-screen button
function full() {

	var videoOutput = document.getElementById("videoOutput");
	$('#videoOutput').toggleClass('videoOutput_full');
	$('full').toggle();
	$('#controls').toggleClass('controls_full');
  /*if (videoOutput.requestFullscreen) {
    videoOutput.requestFullscreen();
  } else if (videoOutput.mozRequestFullScreen) {
    videoOutput.mozRequestFullScreen(); // Firefox
  } else if (videoOutput.webkitRequestFullscreen) {
    videoOutput.webkitRequestFullscreen(); // Chrome and Safari
  }*/
}
