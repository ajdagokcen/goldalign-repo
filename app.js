#!/usr/bin/env node

/*****************************************************************************************
******************************************************************************************
******************************************************************************************
*****																				 *****
*****	GoldAlign:	a graphical interface for gold-standard corpus annotation		 *****
*****				of alignment and paraphrasing									 *****
*****	Copyright (C) 2016 Ajda Gokcen												 *****
*****																				 *****
*****	This file is part of GoldAlign.												 *****
*****																				 *****
*****	GoldAlign is free software: you can redistribute it and/or modify			 *****
*****	it under the terms of the GNU General Public License as published by		 *****
*****	the Free Software Foundation, either version 3 of the License, or			 *****
*****	(at your option) any later version.											 *****
*****																				 *****
*****	GoldAlign is distributed in the hope that it will be useful,				 *****
*****	but WITHOUT ANY WARRANTY; without even the implied warranty of				 *****
*****	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the				 *****
*****	GNU General Public License for more details.								 *****
*****																				 *****
*****	You should have received a copy of the GNU General Public License			 *****
*****	along with GoldAlign.  If not, see <http://www.gnu.org/licenses/>.			 *****
*****																				 *****
******************************************************************************************
******************************************************************************************
*****																				 *****
*****	GoldAlign, specifically in the file index.js, utilizes elements of			 *****
*****	Chris Callison-Burch’s word alignment tool:									 *****
*****																				 *****
*****		Zaidan, Omar, and Chris Callison-Burch. "Fast. Cheap and Creative: 		 *****
*****			Evaluating Translation Quality Using Amazon’s Mechanical Turk."		 *****
*****			Proceedings of the 2009 Conference on Empirical Methods in 			 *****
*****			Natural Language Processing. 2009.									 *****
*****			<https://www.aclweb.org/anthology/D/D09/D09-1030.pdf>.				 *****
*****		(see locally: pdf/callison-burch_2009.pdf)								 *****
*****																				 *****
*****		Callison-Burch, Chris, David Talbot, and Miles Osborne. 				 *****
*****			"Statistical machine translation with word-and sentence-aligned 	 *****
*****			parallel corpora." Proceedings of the 42nd Annual Meeting of the 	 *****
*****			Association for Computational Linguistics. 2004.					 *****
*****			<https://aclweb.org/anthology/P/P04/P04-1023.pdf>.					 *****
*****		(see locally: pdf/callison-burch_2004.pdf)								 *****
*****																				 *****
******************************************************************************************
******************************************************************************************
*****************************************************************************************/

var url = require('url');
var path = require('path');

var app = require('http').createServer(processRequest),
	io = require('socket.io').listen(app),
	fs = require('fs');

var clients = [];
var socketsOfClients = [];

// return a parameter value from the current URL
function getParam(data, sname) {
	var params = data.substr(data.indexOf("?") + 1);
	var sval = "";
	params = params.split("&");
	// split param and value into individual pieces
	for (i in params) {
		temp = params[i].split("=");
		if ([temp[0]] == sname) {
			sval = temp[1];
		}
	}
	return sval.replace(/\+/g, ' ');

}

function getJson(data) {
	var params = data.substr(data.indexOf("?") + 1);
	var sval = [];
	params = params.split("&");
	// split param and value into individual pieces
	for (i in params) {
		temp = params[i].split("=");
		var str = temp[0].text;
		sval.push({
			str: temp[1].value
		});
	}
	return sval;
}

var mimeTypes = {
	'html': 'text/html',
	'htm': 'text/html',
	'png': 'image/png',
	'js': 'text/javascript',
	'css': 'text/css',
	'mp3': "audio/mpeg",
	'ogg': "audio/ogg"
};

function processRequest(request, response) {
	"use strict";
	var uri, filename;
	uri = url.parse(request.url).pathname;
	filename = path.join(process.cwd(), uri);

	if (request.method === 'POST') {
		// the body of the POST is JSON payload.
		var data = '';
		request.addListener('data', function (chunk) {
			data += chunk;
		});
		request.addListener('end', function () {
			var bar = getParam(data, "name");
			console.log(bar);
			console.log("DATA:" + data);
			response.writeHead(200, {
				'content-type': 'text/json'
			});
			response.write(JSON.stringify({
				"id": 5
			}));
			response.end();
		});
	}

	// HOLE: Check for invalid characters in filename.
	// HOLE: Check that this accesses file in CWD's hierarchy.
	fs.exists(filename, function (exists) {
		var extension, mimeType, fileStream;
		if (exists) {
			if (fs.lstatSync(filename).isDirectory())
				filename += "index.html";

			extension = path.extname(filename).substr(1);
			mimeType = mimeTypes[extension] || 'application/octet-stream';
			response.writeHead(200, {
				'Content-Type': mimeType
			});

			fileStream = fs.createReadStream(filename);
			fileStream.pipe(response);

			// attempt to fix wrong urls killing the site
			fileStream.on('error', function (error) {console.log("Caught", error);});
			//fileStream.on('readable', function () {fileStream.read();});

		} else {
			console.log('Does not exists: ' + filename);
			response.writeHead(404, {
				'Content-Type': 'text/plain'
			});
			response.write('404 Not Found\n');
			response.end();
		}
	});
}

//////// Socket IO
io.on('connection', function (socket) {
	var address = socket.handshake.address;
	console.log("Connection from: " + address.address); // + ":" + address.port);

	socket.on('RequestNewUsersAndSet', function(data) {
		var uname = socketsOfClients[socket.id];
		send_file_data(socket,data[0],data[1]);
	});

	socket.on('RequestAllUsersAndSets', function(data) {
		var uname = socketsOfClients[socket.id];
		socket.emit('GetAllUsersAndSets',find_all_users_and_sets());
	});

	socket.on('ReadBatchStructure', function (data) {
		var uname = socketsOfClients[socket.id];
		send_file_data(socket,data[0],data[1]);
	});

	socket.on('ReadWorkingBatch', function (data) {
		var uname = socketsOfClients[socket.id];
		console.log("Read Data: ");
		send_word_data(socket,data[0],data[1],data[2],data[3]);
	});

	socket.on('SaveProgress', function (data) {
		var uname = socketsOfClients[socket.id];
		//console.log("Sure Grid: " + data);
		save_griddata(data[0],data[1],data[2],data[3],'incomplete');
	});

	socket.on('Submit', function (data) {
		var uname = socketsOfClients[socket.id];
		//console.log("Sure Grid: " + data);
		save_griddata(data[0],data[1],data[2],data[3],'complete');
	});
});

/*function send_which_data(socket, users, dataset) {
	socket.emit('GetWhich', [users, dataset]);
}*/

function send_file_data(socket, users, dataset) {
	ensure_needed_files_exist(users, dataset);
	var batchCompletion = [];

	var batchsource = 'data/datasets/' + dataset + '/';
	var batches = fs.readdirSync(batchsource, function (err, files) {
		if (err) throw err;
	}).filter(function (file) {
		return fs.statSync(path.join(batchsource, file)).isFile();
	});

	if (users.length == 1) {
		var worksource = 'data/users/' + users[0] + '/';
		var stages = ['incomplete/', 'complete/'];
		for (i in batches) {
			var thisarr = [0, 0];
			for (j in stages) if (fs.existsSync(worksource+stages[j]+dataset+'/'+batches[i])) thisarr[j] = 1;
			batchCompletion.push(thisarr);
		}
	} else {
		var worksource = 'data/users/';
		//var stages = [users[0]+'/complete/', users[1]+'/complete/', 'arbit/' + users.sort().join('_') + '/incomplete/', 'arbit/' + users.sort().join('_') + '/complete/'];
		var stages = ['arbit/' + users.sort().join('_') + '/incomplete/', 'arbit/' + users.sort().join('_') + '/complete/', users[0]+'/complete/', users[1]+'/complete/'];
		for (i in batches) {
			var thisarr = [0, 0, 0, 0];
			for (j in stages) if (fs.existsSync(worksource+stages[j]+dataset+'/'+batches[i])) thisarr[j] = 1;
			batchCompletion.push(thisarr);
		}
	}

	socket.emit('ShowBatchStructure', [batches, batchCompletion]);
}

function send_word_data(socket, users, dataset, batch, completion) {
	ensure_needed_files_exist(users, dataset);
	if (users.length == 1) {
		if (completion == 2) workingpath = 'users/' + users[0] + '/complete/' + dataset + '/';
		else if (completion == 1) workingpath = 'users/' + users[0] + '/incomplete/' + dataset + '/';
		else {
			workingpath = 'datasets/' + dataset + '/';
			//if (fs.existsSync('data/users/' + users[0] + '/incomplete/' + dataset + '/' + batch)) fs.unlinkSync('data/users/' + users[0] + '/incomplete/' + dataset + '/' + batch);
		}
		//if (fs.existsSync('data/users/' + users[0] + '/complete/' + dataset + '/' + batch)) fs.unlinkSync('data/users/' + users[0] + '/complete/' + dataset + '/' + batch);

		var jsData;
		fs.readFile("data/" + workingpath + batch, "utf8", function (err, jsData) {
			if (err) throw err;
			console.log(jsData);
			socket.emit('ShowWorkingBatch', jsData);
		});
	} else {
		var jsData = []; // new Array();

		//batch = data[0];
		//if (data[1] == 0 && fs.existsSync('data/users/arbit/' + users.sort().join('_') + '/incomplete/' + dataset + '/' + batch)) fs.unlinkSync('data/users/arbit/' + users.sort().join('_') + '/incomplete/' + dataset + '/' + batch);
		//if (fs.existsSync('data/users/arbit/' + users.sort().join('_') + '/complete/' + dataset+ '/' + batch)) fs.unlinkSync('data/users/arbit/' + users.sort().join('_') + '/complete/' + dataset + '/' + batch);

		// first datasets
		var temp = fs.readFileSync("data/datasets/" + dataset + '/' + batch, "utf8");
		if (temp == null) console.log("fileread error");
		console.log(temp);
		jsData.push(temp);

		// then users
		for (i in users) {
			if (fs.existsSync('data/users/' + users[i] + '/complete/' + dataset + '/' + batch)) {
				var temp = fs.readFileSync('data/users/' + users[i] + '/complete/' + dataset + '/' + batch, "utf8");
				if (temp == null) console.log("fileread error");
				console.log(temp);
				jsData.push(temp);
			} else {
				jsData.push('');
				console.log('Annotator ' + users[i] + ' has not completed this batch!');
			}
		}

		// then incomplete arbit
		if (fs.existsSync('data/users/arbit/' + users.sort().join('_') + '/incomplete/' + dataset + '/' + batch)) {
			var temp = fs.readFileSync('data/users/arbit/' + users.sort().join('_') + '/incomplete/' + dataset + '/' + batch, "utf8");
			if (temp == null) console.log("fileread error");
			console.log(temp);
			jsData.push(temp)
		} else jsData.push('');

		console.log(jsData);

		socket.emit('ShowWorkingBatch', jsData);
	}
}

//function save_griddata(dat, folder) {
function save_griddata(users, dataset, batch, griddata, completion) {
	ensure_needed_files_exist(users, dataset);
	if (users.length == 1) {
		if (fs.existsSync('data/users/' + users[0] + '/complete/' + dataset + '/' + batch)) fs.unlinkSync('data/users/' + users[0] + '/complete/' + dataset + '/' + batch);
		fs.writeFile('data/users/' + users[0] + '/' + completion + '/' + dataset + '/' + batch, griddata, "utf8", function (err) {
			if (err) return console.log(err);
			else console.log("Saved....");
		});
	} else {
		if (fs.existsSync('data/users/arbit/' + users.sort().join('_') + '/complete/' + dataset + '/' + batch)) fs.unlinkSync('data/users/arbit/' + users.sort().join('_') + '/complete/' + dataset + '/' + batch);
		fs.writeFile('data/users/arbit/' + users.sort().join('_') + '/' + completion + '/' + dataset + '/' + batch, griddata, "utf8", function (err) {
			if (err) return console.log(err);
			else console.log("Saved....");
		});
	}
}

function find_all_users_and_sets() {
	ensure_needed_files_exist([],'');
	var usersOnFile = fs.readdirSync('data/users/', function (err, files) {
		if (err) throw err;
	}).filter(function (file) {
		//return fs.statSync(path.join('data/users/', file)).isDirectory();
		//return ['datasets','arbit'].indexOf(file) <= -1 && fs.statSync(path.join('data/users/', file)).isDirectory();
		return file != 'arbit' && fs.statSync(path.join('data/users/', file)).isDirectory();
	});

	var datasetsOnFile = fs.readdirSync('data/datasets/', function (err, files) {
		if (err) throw err;
	}).filter(function (file) {
		return fs.statSync(path.join('data/datasets/', file)).isDirectory();
	});

	return [usersOnFile,datasetsOnFile];
}

function ensure_needed_files_exist(users, dataset) {
	if (!fs.existsSync('data')) fs.mkdirSync('data'); //won't happen
	if (!fs.existsSync('data/users')) fs.mkdirSync('data/users'); //won't happen
	if (!fs.existsSync('data/users/arbit')) fs.mkdirSync('data/users/arbit'); //shouldn't happen??
	if (!fs.existsSync('data/datasets')) fs.mkdirSync('data/datasets'); //won't happen
	if (dataset != '' && !fs.existsSync('data/datasets/' + dataset)) fs.mkdirSync('data/datasets/' + dataset); //won't happen
	if (users.length > 0) {
		if (!fs.existsSync('data/users/' + users[0])) fs.mkdirSync('data/users/' + users[0]); //this won't happen. if it does.... ???
		if (!fs.existsSync('data/users/' + users[0] + '/incomplete')) fs.mkdirSync('data/users/' + users[0] + '/incomplete');
		if (!fs.existsSync('data/users/' + users[0] + '/complete')) fs.mkdirSync('data/users/' + users[0] + '/complete');
		if (dataset != '') {
			if (!fs.existsSync('data/users/' + users[0] + '/incomplete/' + dataset)) fs.mkdirSync('data/users/' + users[0] + '/incomplete/' + dataset);
			if (!fs.existsSync('data/users/' + users[0] + '/complete/' + dataset)) fs.mkdirSync('data/users/' + users[0] + '/complete/' + dataset);
		}
		if (users.length > 1) {
			if (!fs.existsSync('data/users/' + users[1])) fs.mkdirSync('data/users/' + users[1]); //again, this won't happen
			if (!fs.existsSync('data/users/' + users[1] + '/incomplete')) fs.mkdirSync('data/users/' + users[1] + '/incomplete');
			if (!fs.existsSync('data/users/' + users[1] + '/complete')) fs.mkdirSync('data/users/' + users[1] + '/complete');
			if (!fs.existsSync('data/users/arbit/' + users.sort().join('_'))) fs.mkdirSync('data/users/arbit/' + users.sort().join('_'));
			if (!fs.existsSync('data/users/arbit/' + users.sort().join('_') + '/incomplete')) fs.mkdirSync('data/users/arbit/' + users.sort().join('_') + '/incomplete');
			if (!fs.existsSync('data/users/arbit/' + users.sort().join('_') + '/complete')) fs.mkdirSync('data/users/arbit/' + users.sort().join('_') + '/complete');
			if (dataset != '') {
				if (!fs.existsSync('data/users/' + users[1] + '/incomplete/' + dataset)) fs.mkdirSync('data/users/' + users[1] + '/incomplete/' + dataset);
				if (!fs.existsSync('data/users/' + users[1] + '/complete/' + dataset)) fs.mkdirSync('data/users/' + users[1] + '/complete/' + dataset);
				if (!fs.existsSync('data/users/arbit/' + users.sort().join('_') + '/incomplete/' + dataset)) fs.mkdirSync('data/users/arbit/' + users.sort().join('_') + '/incomplete/' + dataset);
				if (!fs.existsSync('data/users/arbit/' + users.sort().join('_') + '/complete/' + dataset)) fs.mkdirSync('data/users/arbit/' + users.sort().join('_') + '/complete/' + dataset);
			}
		}
	}
}

//io.set('log level', 1);
if (process.argv.length >= 3 && !isNaN(process.argv[2])) app.listen(process.argv[2]);
else app.listen(2001);

