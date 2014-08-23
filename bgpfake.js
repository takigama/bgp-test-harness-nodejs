var readline = require('readline');
var net = require('net');



// ---- vars

var asPaths = new Array();
var readyToSend = false;
var currentPrompt;
var rl;
var nCons = 0;
var nSent = 0;
var myAS;
var myIP;
var server;
var cState = "starting";
var currentIPa = 1;
var currentIPb = 0;
var currentIPc = 0;
var timerIntervalObject;
var currentCon = 0;
var sequentialIPs = true;
var usePrivateRanges = false;
var randomNextHop = false;
var timeBetweenUpdates = 50;
var routesPerUpdate = 41;
var updatesPerInterval = 3;
var autoPauseAfter = 0;
var nextPause = 0;
var timerCurrentlyRunning = false;
var conns = new Array();
var perPeerUpdates = true;
var nextUpdateWithoutIncrement = false;

// ---- vars


if(typeof process.argv[2] == "undefined") {
	usage();
}

if(typeof process.argv[3] == "undefined") {
	usage();
}

function usage() {
	console.log("Usage: "+process.argv[1]+" MyAS MyIP");
	process.exit(1);
}





// ----------- startup

myAS = process.argv[2];
myIP = process.argv[3];


startCLI();
doPrompt();
createAsPathArray(1048576);
startServer();
cState = "idle";
doPrompt();

// ----------- startup










// --------- CLI

function updatePrompt() {
	currentPrompt = "("+myAS+"/"+myIP+") "+cState+":"+nCons+"/"+nSent+" ("+currentIPa+"."+currentIPb+"."+currentIPc+") > ";
}

function startCLI() {
	currentPrompt = "("+myAS+"/"+myIP+") starting... > ";

	rl = readline.createInterface({
		  input: process.stdin,
		  output: process.stdout
		});
	
	rl.on('line', function (cmd) {
		switch(cmd[0]) {
		
		case "?":
		case "h":
			printCLIUsage();
			break;
		case "r":
			currentIPa = 1;
			currentIPb = 0;
			currentIPc = 0;
			break;
		case "a":
			togglePrivateRange();
			break;
		case "t":
			toggleIPChoice();
			break;
		case "n":
			setRouteUpdateTimers(cmd);
			break;
		case "l":
			toggelPerPerrUpdates();
			break;
		case "k":
			setAutoPause(cmd);
			break;
		case "m":
			toggleRandomNextHop();
			break;
		case "s":
			printStatus();
			break;
		case "u":
			startUpdates();
			break;
		case "p":
			stopUpdates();
			break;
		case "q":
		case "e":
			  rl.close();
			  process.exit(0);
			  break;
		case "":
			break;
		}
		
		doPrompt();
	});
}


function toggelPerPerrUpdates() {
	if(perPeerUpdates) {
		perPeerUpdates = false;
		console.log("LOG: turning off per-peer updates (each connected peer gets same AS path and same next-hop)");
	} else {
		perPeerUpdates = true;
		console.log("LOG: turning off per-peer updates (each connected peer gets differe AS path and different next-hop (if random next-hop is turned on)");		
	}
}
/*
 * var timeBetweenUpdates = 20;
var routesPerUpdate = 100;
var updatesPerInterval = 40;

 */
function printStatus() {
	console.log("---- Status ----");
	console.log("Currently "+cState);
	console.log("Private ranges: "+usePrivateRanges);
	console.log("Sequential publication: "+sequentialIPs);
	console.log("Per-Peer updates: "+perPeerUpdates);
	console.log("Random NextHop: "+randomNextHop);
	console.log("Number of connected peers: " + nCons);
	console.log("Number of routes published: " + nSent);
	console.log("My IP address: " + myIP);
	console.log("Update timers: " + timeBetweenUpdates + "ms between publications, " + updatesPerInterval + " updates per publication, " + routesPerUpdate + " routes per update");
	console.log("My ASN: " + myAS);
	console.log("Current IP (for sequential publications): " + currentIPa + "." + currentIPb + "." + currentIPc + ".0/24");
	console.log("AS path table size: "+asPaths.length);
	if(autoPauseAfter == 0) {
		console.log("Automatically pause off");
	} else {
		console.log("Automatically pause after "+autoPauseAfter+" route updates, next pause at "+nextPause);
	}
	if(conns.length != 0) {
		console.log("Connections from: ");
		for(var t=0; t<conns.length; t++) {
			console.log("\t"+conns[t].remoteAddress);
		}
	} else {
		console.log("No currently connected peers");
	}
	
}


function setAutoPause(cmd) {
	var timers = cmd.split(" ");
	if(typeof timers[1] != "undefined") {
		autoPauseAfter = parseInt(timers[1]);
		
		if(autoPauseAfter < 0) {
			console.log("LOG: autopause is either a minimum of 1 or set to 0 for diabling autopause");
		}
		nextPause = nSent+autoPauseAfter;
		if(autoPauseAfter == 0) {
			nextPause = 0;
			console.log("LOG: autopause disabled");
		} else {
			console.log("LOG: autopause enabled. Will pause after another "+autoPauseAfter+" updates, which is "+nextPause+" more routes - note that this isnt necessarily exact as if many routes per update are sent then it'll do a complete update which may exceed this");
		}
	} else {
		console.log("LOG: Usage incorrect, \"k 1000\" for example");

	}
	
}

function setRouteUpdateTimers(cmd) {
	var timers = cmd.split(" ");
	
	if(typeof timers[3] != "undefined") {
		timeBetweenUpdates = parseInt(timers[1]);
		updatesPerInterval = parseInt(timers[2]);
		routesPerUpdate = parseInt(timers[3]);
		
		if(timeBetweenUpdates < 5) {
			timeBetweenUpdates = 5;
			console.log("LOG: time between publication must be greater then 5, setting to 5");
		}
		
		if(routesPerUpdate < 1) {
			routesPerUpdate = 1;
			console.log("LOG: minimum of 1 route per publication, setting to 1");
		}
		
		if(routesPerUpdate > 120) {
			routesPerUpdate = 120;
			console.log("LOG: maximum of 120 route per publication, setting to 120");
		}

		if(updatesPerInterval < 1) {
			updatesPerInterval = 1;
			console.log("LOG: minimum of 1 update per publication, setting to 1");
		}
		
		if(updatesPerInterval > 512) {
			updatesPerInterval = 512;
			console.log("LOG: maximum of 512 update per publication, setting to 512");
		}
		
		if(timerCurrentlyRunning) {
			clearInterval(timerIntervalObject);
			timerIntervalObject = setInterval(sendUpdate, timeBetweenUpdates);
		}
		
	} else {
		console.log("LOG: Usage incorrect, \"n 100 2 3\" for example");
	}
	
	//console.log("LOG: timers: ");
	//console.log(timers);
}

function togglePrivateRange() {
	if(usePrivateRanges) {
		console.log("Switching off private range publication");
		usePrivateRanges = false;
	} else {
		console.log("Switching on private range publication");
		usePrivateRanges = true;
	}
}

function toggleIPChoice() {
	if(sequentialIPs) {
		sequentialIPs = false;
		console.log("Switching to random IP addresses");
	} else {
		console.log("Switching to sequential IP addresses");
		sequentialIPs = true;
	}
}


function toggleRandomNextHop() {
	if(randomNextHop) {
		randomNextHop = false;
		console.log("Switching form random next-hop to next-hop-self");
	} else {
		randomNextHop = true;
		console.log("Switching form next-hop-self to random next-hop");
	}
	
}

function doPrompt() {
	updatePrompt();
	rl.setPrompt(currentPrompt);
	rl.prompt();	
}

function printCLIUsage() {
	console.log("Help - (x) is default settings");
	console.log("\th[elp],? - this help menu");	
	console.log("\tu - start sending route updates to connected peers");
	console.log("\tp - pause sending route updates to connected peers");
	console.log("\ta - toggle use of private ranges (false)");
	console.log("\tn a b c - change timers, a is time between publications in ms (20), b is number of updates per publication (40), c is number of routes per update (100)");
	console.log("\tm - toggle between random next hop and my ip as next hop, randomise last octet (false)");
	console.log("\ts - status");
	console.log("\tt - toggles between random and sequential addressing (sequential)");
	console.log("\tr - reset IP range back to beginning");
	console.log("\tl - toggle per-peer updates (true). Each connected peer gets same next-hop and AS Path when this is false");
	console.log("\tk x - automatically pause after x route publications, 0 to disable");
	console.log("\tq[uit],exit,end - Quit");
	console.log("Prompt layout");
	console.log("\t(AS/IP) state:connections/updates-sent (current-route)");
}

function updateState(newstate) {
	if(cState == newstate) {
		//doPrompt();
		return;
	}
	
	//starting
	if(newstate == "starting") {
		cState = newstate;
		doPrompt();
		return;
	}
	
	// idle
	if(newstate == "idle") {
		cState = newstate;
		doPrompt();
		return;
	}

	// connected
	if(newstate == "connected") {
		cState = newstate;
		doPrompt();
		return;
	}
	
	// ready
	if(newstate == "ready") {
		if(cState == "sending") return;
		cState = newstate;
		doPrompt();
		return;
	}

	// sending
	if(newstate == "sending") {
		cState = newstate;
		doPrompt();
		return;
	}
	
	if(newstate == "stopping") {
		cState = "stopping";
		doPrompt();
		return;
	}

	
}

// ------------- CLI













//------------- network

function reevalutateConnectionStack() {
	// TODO: re-index the connection array
	var newcons = Array();
	for(var t=0; t<conns.length; t++) {
		if(typeof conns[t].remoteAddress != "undefined") {
			newcons.push(conns[t]);
		}
	}
	
	nCons = newcons.length;
	
	conns = newcons;
}

function startUpdates() {
	if(cState == "sending") {
		console.log("LOG: already sending...");
		return;
	}
	
	if(cState != "ready") {
		console.log("LOG: not ready to send yet");
		return;
	}
	
	
	// here goes nothing
	console.log("LOG: Sending updates to peer");
	updateState("sending");
	timerIntervalObject = setInterval(sendUpdate, timeBetweenUpdates);
	timerCurrentlyRunning = true;
	//console.log("LOG: stopped sending updates");
}


function sendUpdate()
{
	var pIPa = 1;
	var pIPb = 0;
	var pIPc = 0;
	var xIPa = 1;
	var xIPb = 0;
	var xIPc = 0;

	
	
	if(nextPause !=0 ) {
		if(nSent >= nextPause) {
			updateState("stopping");
			nextPause = nSent + autoPauseAfter;
		}
	}
	if(cState != "sending") {
		console.log("LOG: Stopping publications");
		clearInterval(timerIntervalObject);
		timerCurrentlyRunning = false;
		updateState("ready");
	} else {
		
		
		// TODO: this code is a little ugly, it could really be re-factored
		for(var i=0; i<updatesPerInterval; i++) {
			if(!perPeerUpdates) var msg = constructUpdateMessage(routesPerUpdate, myIP);
			for(var t=0; t<conns.length; t++) {
				if(typeof conns[t].remoteAddress != "undefined") {
					if(perPeerUpdates) {
						pIPa = currentIPa;
						pIPb = currentIPb;
						pIPc = currentIPc;

						msg = constructUpdateMessage(routesPerUpdate, conns[t].localAddress);
						
						xIPa = currentIPa;
						xIPb = currentIPb;
						xIPc = currentIPc;
						currentIPa = pIPa;
						currentIPb = pIPb;
						currentIPc = pIPc;
					}
					conns[t].write(msg);
				}
			}
			
			if(perPeerUpdates) {
				currentIPa = xIPa;
				currentIPb = xIPb;
				currentIPc = xIPc;
			}
		}
		nSent += routesPerUpdate*updatesPerInterval;
	}
	
}


function stopUpdates() {
	if(cState != "sending") {
		console.log("LOG: not in a sending state, cant pause.");
		return;
	}
	
	updateState("stopping");
}

function serverconnection(c) {

	scon = c;
	
	c.on("end", function() {
		//console.log("Server disconnected");
		console.log("LOG: disconnection from a server");
		nCons--;
		if(nCons < 1) {
			cState = "idle";
			doPrompt();
		}
		currentCon = 0;
		reevalutateConnectionStack();
	});

	c.on("data", function(buffer) {
		parseBuffer(buffer, c);
	});
	

	currentCon = c;
	
	conns.push(c);
	
	cState = "connected";
	nCons++;
	doPrompt();
	


	console.log("LOG: connection from "+c.remoteAddress);
	doPrompt();

	//c.write("hello\r\n");
	
}


function startServer() {
	server = net.createServer(serverconnection);

	server.listen(179, function() {
		//console.log("LOG: Server bound");
		doPrompt();
	});
	
}

//------------- network










// -------------- BGP 

function getRandomNextHop() {
	ipa = 1+Math.round(Math.random()*120);
	ipb = 1+Math.round(Math.random()*254);
	ipc = 1+Math.round(Math.random()*254);
	ipd = 1+Math.round(Math.random()*254);
	
	return ipa+"."+ipb+"."+ipc+"."+ipd;

}

function getNextIP() {
	// split into octets
	//var currentIPa = 1;
	//var currentIPb = 0;
	//var currentIPc = 0;

	
	if(sequentialIPs) {
		currentIPc++;
		if(currentIPc > 254) {
			
			currentIPb++;
			currentIPc = 0;
			if(!usePrivateRanges) if(currentIPb == 168 && currentIPa == 192) currentIPb++;
			if(currentIPb > 254) {
				currentIPa++;
				currentIPb = 0;
				
				// dont publish bogons or 127
				if(!usePrivateRanges) {
					if(currentIPa == 10) currentIPa++;
					if(currentIPa == 127) currentIPa++;
					if(currentIPa == 128) currentIPa++;			
					if(currentIPa == 172) currentIPa++;
				}
			}
		}
		
		if(currentIPa > 223) {
			console.log("LOG: hit the end of the range, wrapping");
			currentIPa = 1;
			currentIPb = 0;
			currentIPc = 0;
		}
		
		//console.log("created "+a+"."+b+"."+c+" from "+i);
		return currentIPa+"."+currentIPb+"."+currentIPc;
	} else {
		ipa = 1+Math.round(Math.random()*223);
		ipb = 1+Math.round(Math.random()*254);
		ipc = 1+Math.round(Math.random()*254);
		
		
		if(!usePrivateRanges) {
			if(ipb == 168 && ipa == 192) ipb++;
			if(ipa == 10) ipa++;
			if(ipa == 127) ipa++;
			if(ipa == 128) ipa++;			
			if(ipa == 172) ipa++;
		}			

		return ipa+"."+ipb+"."+ipc;
	}

}

function getASPath() {
	var n = Math.random();
	
	return asPaths[Math.round(asPaths.length*n)];
}

function constructUpdateMessage(n_up, localIP) {
	var bsize = 0;

	var aspath = getASPath();
	//console.log("aspath is");
	//console.log(aspath);
	
	// first the header components
	bsize += 16;

	// next the length component
	bsize += 2;

	// next the n unfeasible
	bsize += 2;

	// next, path attr length
	bsize += 2;


	// now we begin the path attrs
	// first origin - simple
	var aspathn = 4;

	// next as path - hard, flag + type + len + aspath segment
	aspathn += 3;

	// as path segment size = 1 (type), + 1 (len) + as's*2
	var aspathlen = ((aspath.length+1)*2)+1+1;
	aspathn += aspathlen;
	
	// now next hop attrs = flag (1) + type (1) + len (1) + octets (4);
	aspathn += 7;
	bsize += aspathn;

	// now nlri = prefix len (1) + prefix fixed in our case (3)
	bsize += 4*n_up;

	// fudge
	bsize+=1;

	//console.log("size: " + bsize + ", an: " + aspathn + " al:" + aspathlen);
	var buf = new Buffer(bsize);
	var bp = 0;

	// now lets create the buffer
	buf.fill(0xff, bp, bp+16);
	bp+=16;
	buf.writeUInt16BE(bsize, bp);
	bp+=2;
	buf.writeUInt8(2, bp);
	bp++;
	buf.writeUInt16BE(0, bp);
	bp+=2;
	buf.writeUInt16BE(aspathn, bp);
	bp+=2;

	// path attr
	// origin
	buf.writeUInt8(0x40, bp);
	bp++;
	buf.writeUInt8(1, bp);
	bp++;
	buf.writeUInt8(1, bp);
	bp++;
	buf.writeUInt8(0, bp);
	bp++;

	// as path
	buf.writeUInt8(0x40, bp);
	bp++;
	buf.writeUInt8(2, bp);
	bp++;
	buf.writeUInt8(aspathlen, bp);
	bp++;
	buf.writeUInt8(2, bp);
	bp++;
	buf.writeUInt8(aspath.length+1, bp);
	bp++;
	//console.log("writing in my aspath: "+myas);
	buf.writeUInt16BE(myAS, bp);
	bp+=2;
	aspath.forEach(function (ed) {
		//console.log("writing in aspath: "+ed);
		buf.writeUInt16BE(ed, bp);
		bp+=2;
	});

	// next hop
	buf.writeUInt8(0x40, bp);
	bp++;
	buf.writeUInt8(3, bp);
	bp++;
	buf.writeUInt8(4, bp);
	bp++;
	
	if(randomNextHop) {
		rnh = getRandomNextHop();
		rnh.split(".").forEach(function (ed) {
			//console.log("writing in next hop info: " + ed);
			buf.writeUInt8(parseInt(ed), bp);
			bp++;
		});
	} else {
		localIP.split(".").forEach(function (ed) {
			//console.log("writing in next hop info: " + ed);
			buf.writeUInt8(parseInt(ed), bp);
			bp++;
		});
	}
	
//	if(randomNextHop) {
//		nhns = Math.round(1+(Math.random()*250));
//		bp--
//		buf.writeUInt8(nhns, bp);
//		bp++;
//	}

	// last, nlri
	for(var nn=0; nn < n_up; nn++) {
		//console.log("bsize: "+bsize+" bp "+bp);
		buf.writeUInt8(24, bp);
		bp++;
		var ip = getNextIP();
		ip.split(".").forEach(function(ed){
			//console.log("Writing in nlri: "+ed);
			buf.writeUInt8(parseInt(ed), bp);
			bp++;
		});
	}
	
	
	//console.log("buf is:");
	//console.log(buf);
	//console.log(buf.length);

	return buf;
}

function createAsPathArray(size) {
	for(var i=0; i<size; i++) {
		asPaths[i] = createaspath(i);
	}
}


function createaspath(i) {
	var n=(i%5)+2;
	var as = 1024;
	var ret = new Array();

	for(var t=0; t<n; t++) {
		i = i << 1;
		as = 1024 + (i%30000);
		ret[t] = as;
	}
	return ret;
}

function parseBuffer(b, c) {
	var len = b.readUInt16BE(16);
	var type = b.readUInt8(18);

	//console.log("got input: " + len + ", type: " + type);

	if(type == 1) {
		var vers = b.readUInt8(19);
		var as = b.readUInt16BE(20);
		var ht = b.readUInt16BE(22);
		var ot1 = b.readUInt8(24);
		var ot2 = b.readUInt8(25);
		var ot3 = b.readUInt8(26);
		var ot4 = b.readUInt8(27);
		var opl = b.readUInt8(28);
		//console.log("got open type, vers: "+vers+", as: " + as);
		//console.log("ht: " + ht + ", id: "+ot1+"."+ot2+"."+ot3+"."+ot4+", opl: "+opl);


		//console.log("sending our open type");
		var out = new Buffer(29);


		out.fill(0xff, 0, 16);
		out.writeUInt16BE(29, 16);
		out.writeUInt8(1, 18);
		out.writeUInt8(4, 19);
		out.writeUInt16BE(myAS, 20);
		out.writeUInt16BE(90, 22);
		
		var thisIP = c.localAddress.split(".");
		out.writeUInt8(parseInt(thisIP[0]), 24);
		out.writeUInt8(parseInt(thisIP[1]), 25);
		out.writeUInt8(parseInt(thisIP[2]), 26);
		out.writeUInt8(parseInt(thisIP[3]), 27);
			
		out.writeUInt8(0,28);

		c.write(out);
	} else if(type == 4) {
		//console.log("writing keepalive - exact as sent");
		//console.log("LOG: keepalive from remote ("+c.remoteAddress+")");
		c.write(b);
		readyToSend = true;
		updateState("ready");
		//if(updateSent ==0) beginUpdateSend(c);
	} else if(type == 2) {
		//console.log("got update...");
		console.log("LOG: update from remote ("+c.remoteAddress+")");
		readyToSend = true;
		updateState("ready");
	} else if(type == 3) {
		var loc = b.readUInt8(19);
		var msg = b.readUInt8(20);
		var fromremote = parseNotifyMessage(loc, msg);
		console.log("LOG: Notification message from server ("+loc+"/"+msg+"): " + fromremote);
	} else {
		//console.log("sending end...");
		c.end();
	}

	doPrompt();
	
}

function parseNotifyMessage(loc, msg) {
	var retmsg = "";
	switch(loc) {
		case 1:
			retmsg += "Header Error - ";
			if(msg == 1) retmsg += "Not Synchronised";
			else if(msg == 2) retmsg += "Bad Message Length";
			else if(msg == 3) retmsg += "Bad Message Type";
			else retmsg += "Unknown error code: "+msg;
			break;
		case 2:
			retmsg += "Open Error - ";
			if(msg == 1) retmsg += "Unsupported Version";
			else if(msg == 2) retmsg += "AS Missmatch";
			else if(msg == 3) retmsg += "Bad BGP ID";
			else if(msg == 4) retmsg += "Unsupported Option Parameter";
			else retmsg += "Unknown error code: "+msg;
			break;
		case 3:
			retmsg += "Update Error - ";
			if(msg == 1) retmsg += "Malformed attribute list";
			else if(msg == 2) retmsg += "Unknown recognised well-known attribute";
			else if(msg == 3) retmsg += "Missing well-known attribute";
			else if(msg == 4) retmsg += "Attribute flag error";
			else if(msg == 5) retmsg += "Attribute length error";
			else if(msg == 6) retmsg += "Invalid origin attribute";
			else if(msg == 7) retmsg += "Deprecated error message (other end is waaay too old)";
			else if(msg == 8) retmsg += "Invalid next hop attribute";
			else if(msg == 9) retmsg += "Optional attribute error";
			else if(msg == 10) retmsg += "Invalid network field";
			else if(msg == 11) retmsg += "Malformed AS path";
			else retmsg += "Unknown error code: "+msg;
			break;
		case 4:
			retmsg += "Hold Timer Expired - ";
			break;
		case 5:
			retmsg += "Finite State Machine error - "+msg;
			break;
		default:
			retmsg += "Unknown erorr type - "+msg; 
	}
	
	return retmsg;
	
}

//-------------- BGP