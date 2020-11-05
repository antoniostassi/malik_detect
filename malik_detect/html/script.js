// ------------------------------------------------------------
// ------------------------------------------------------------
// ---- Author: Dylan 'Itokoyamato' Thuillier              ----
// ----                                                    ----
// ---- Email: itokoyamato@hotmail.fr                      ----
// ----                                                    ----
// ---- Resource: tokovoip_script                          ----
// ----                                                    ----
// ---- File: script.js                                    ----
// ------------------------------------------------------------
// ------------------------------------------------------------

// --------------------------------------------------------------------------------
// --	Using websockets to send data to TS3Plugin
// --------------------------------------------------------------------------------

function getTickCount () {
	let date = new Date();
	let tick = date.getTime();
	return (tick);
}

let websocket;
let endpoint;
let connected = false;
let lastOk = 0;
let scriptName = GetParentResourceName()

let voip = {};


const OK = 0;
const NOT_CONNECTED = 1;
const PLUGIN_INITIALIZING = 2;
const WRONG_SERVER = 3;
const WRONG_CHANNEL = 4;
const INCORRECT_VERSION = 5;
const INCORRECT_SCRIPTNAME = 6;

let wsStates = {
	FiveM: {
		state: NOT_CONNECTED
	},
	Ts3: {
		state: NOT_CONNECTED
	}
}

function disconnect (src) {
	updateWsState(src, NOT_CONNECTED)
	voipStatus = NOT_CONNECTED

	if (document.getElementById('pluginScreen').style.display == 'block') {
		setTimeout(() => {
			displayPluginScreen(true);
		}, 5000);
	}
}

function init (address) {
	if (!address) return;
	endpoint = address;
	console.log('TokoVOIP: attempt new connection');
	websocket = new WebSocket(`ws://${endpoint}/socket.io/?EIO=3&transport=websocket&from=fivem`);

	websocket.onopen = () => {
		updateWsState('FiveM', OK)
		console.log('TokoVOIP: connection opened');
		connected = true;
		updateWsState('FiveM', OK)
	};

	websocket.onmessage = (evt) => {
		let msg = '';
		if (evt.data.includes('42["')) {
			const parsed = JSON.parse(evt.data.replace('42', ''));
			msg = {
				event: parsed[0],
				data: parsed[1],
			};
		}

		if (msg.event === 'setTS3Data') {
			if (msg.data.pluginStatus !== undefined) updateScriptData('pluginStatus', parseInt(msg.data.pluginStatus));
			updateWsState('Ts3', OK)
			updateScriptData('pluginVersion', msg.data.pluginVersion);
			updateScriptData('pluginUUID', msg.data.uuid);
			if (msg.data.talking !== undefined) $.post(`http://${scriptName}/setPlayerTalking`, JSON.stringify({ state: (msg.data.talking) ? 1 : 0 }));
		}

		if (msg.event === 'ping') websocket.send(`42${JSON.stringify(['pong', ''])}`);

		if (msg.event === 'disconnectMessage') { console.error('disconnectMessage: ' + msg.data); disconnect('Ts3') }
	};

	websocket.onerror = (evt) => {
		console.error('TokoVOIP: error - ' + evt.data);
	};

	websocket.onclose = () => {
		sendData('disconnect');
		disconnect('FiveM')
		console.log('FiveM Disconnected')

		updateWsState('FiveM', NOT_CONNECTED)

		let reason;
		if (event.code == 1000)
			reason = 'Normal closure, meaning that the purpose for which the connection was established has been fulfilled.';
		else if (event.code == 1001)
			reason = 'An endpoint is \'going away\', such as a server going down or a browser having navigated away from a page.';
		else if (event.code == 1002)
			reason = 'An endpoint is terminating the connection due to a protocol error';
		else if (event.code == 1003)
			reason = 'An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).';
		else if (event.code == 1004)
			reason = 'Reserved. The specific meaning might be defined in the future.';
		else if (event.code == 1005)
			reason = 'No status code was actually present.';
		else if (event.code == 1006)
			reason = 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
		else if (event.code == 1007)
			reason = 'An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).';
		else if (event.code == 1008)
			reason = 'An endpoint is terminating the connection because it has received a message that \'violates its policy\'. This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.';
		else if (event.code == 1009)
			reason = 'An endpoint is terminating the connection because it has received a message that is too big for it to process.';
		else if (event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
			reason = 'An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn\'t return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: ' + event.reason;
		else if (event.code == 1011)
			reason = 'A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.';
		else if (event.code == 1015)
			reason = 'The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can\'t be verified).';
		else
			reason = 'Unknown reason';

		console.log('TokoVOIP: closed connection - ' + reason);
		connected = false;
		updateScriptData('pluginStatus', -1);
		init(endpoint);
	};
}

function sendData (message) {
	if (websocket.readyState != websocket.OPEN) return;
	websocket.send(`42${JSON.stringify(['data', message])}`);
}

function checkPluginStatus () {
	switch (parseInt(voip.pluginStatus)) {
		case -1:
			voipStatus = NOT_CONNECTED;
			break;
		case 0:
			voipStatus = PLUGIN_INITIALIZING;
			break;
		case 1:
			voipStatus = WRONG_SERVER;
			break;
		case 2:
			voipStatus = WRONG_CHANNEL;
			break;
		case 3:
			voipStatus = OK;
			break;
	}

	if (!canCallCallback(scriptName)) {
		voipStatus = INCORRECT_SCRIPTNAME
	}
}

function displayPluginScreen (toggle) {
	document.getElementById('pluginScreen').style.display = (toggle) ? 'block' : 'none';
}



function updateConfig (payload) {
	voip = payload;
	document.getElementById('TSServer').innerHTML = `TeamSpeak server: <font color="#01b0f0">${voip.plugin_data.TSServer}</font>`;
	document.getElementById('TSChannel').innerHTML = `TeamSpeak channel: <font color="#01b0f0">${(voip.plugin_data.TSChannelWait) ? voip.plugin_data.TSChannelWait.replace(/\[[a-z]spacer(.*?)\]/, '') : voip.plugin_data.TSChannel.replace(/\[[a-z]spacer(.*?)\]/, '')}</font>`;
	document.getElementById('TSDownload').innerHTML = voip.plugin_data.TSDownload;
	document.getElementById('pluginVersion').innerHTML = `Plugin version: <font color="red">Not found</font> (Minimal version: ${voip.minVersion})`;
}

function updatePlugin () {
	if (!connected) return;
	sendData(voip.plugin_data);
}

function canCallCallback (str) {
	return str.toLowerCase() == str
}

function updateScriptData (key, data) {
	if (voip[key] === data) return;
	if (!canCallCallback(scriptName)) {
		voipStatus = INCORRECT_SCRIPTNAME
	}
	$.post(`http://${scriptName}/updatePluginData`, JSON.stringify({
		payload: {
			key,
			data,
		}
	}));
}

