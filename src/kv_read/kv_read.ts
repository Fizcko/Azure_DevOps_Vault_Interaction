import tl = require('azure-pipelines-task-lib/task');
const url = require('url');
const http = require('http');
const https = require("https");
const path = require('path');
const Stream = require('stream').Transform;

async function run() {
	
	try {

		tl.setResourcePath(path.join(__dirname, 'task.json'));

		var strUrl = tl.getInput('strUrl', true);
		var strAuthType = tl.getInput('strAuthType', true);
		var ignoreCertificateChecks = tl.getBoolInput('ignoreCertificateChecks', true);

		var strToken = tl.getInput('strToken', false);
		var strUsername = tl.getInput('strUsername', false);
		var strPassword = tl.getInput('strPassword', false);
		var strRoleID = tl.getInput('strRoleID', false);
		var strSecretID = tl.getInput('strSecretID', false);

		// Setup options for requests
		console.log("[INFO] Vault URL : '" + strUrl + "'");

		var authUrl = null;
		
		switch(strAuthType){
			case "clientToken":
				console.log("[INFO] Authentication Method : 'Client Token'");
				getKVSecrets(strUrl, strToken, ignoreCertificateChecks);
				break;
			case "userpass":
				console.log("[INFO] Authentication Method : 'Username & Password'");
				authUrl = url.resolve(strUrl,'/v1/auth/userpass/login/' + strUsername);
				console.log("[INFO] Authentication URL : '" + authUrl + "'");
				var body_data = JSON.stringify({
					password: strPassword
				});
				getTokenThenProcess(strUrl, authUrl, ignoreCertificateChecks, body_data);				
				break;
			case "ldap":
				console.log("[INFO] Authentication Method : 'LDAP'");
				authUrl = url.resolve(strUrl,'/v1/auth/ldap/login/' + strUsername);
				console.log("[INFO] Authentication URL : '" + authUrl + "'");
				var body_data = JSON.stringify({
					password: strPassword
				});
				getTokenThenProcess(strUrl, authUrl, ignoreCertificateChecks, body_data);				
				break;
			case "approle":
				console.log("[INFO] Authentication Method : 'AppRole'");
				authUrl = url.resolve(strUrl,'/v1/auth/approle/login');
				console.log("[INFO] Authentication URL : '" + authUrl + "'");
				var body_data = JSON.stringify({
					role_id: strRoleID,
					secret_id: strSecretID
				});
				getTokenThenProcess(strUrl, authUrl, ignoreCertificateChecks, body_data);				
				break;
			default:
				throw new Error("Authentication method not supported.");
		}	
		
		tl.setResult(tl.TaskResult.Succeeded, "Wrapping successfull.");

	} catch (err) {
		tl.setResult(tl.TaskResult.Failed, err);
	}
	
}

// Source https://raw.githubusercontent.com/geeklearningio/gl-vsts-tasks-variables/master/Common/Node/expandJObject.ts
function exportJSONValues(obj: any, prefix: string){

	var typeArray: string[] =["string", "number", "boolean"];

	if (obj instanceof Array) {
		for (var i = 0; i < obj.length; i++) {
			var element = obj[i];
			exportJSONValues(element, prefix + "_" + i.toString());
		}
	}
	else if (typeArray.indexOf(typeof obj) > -1){
		var objValue = typeArray.indexOf(typeof obj)>0 ? obj.toString() : obj;
		var objDisplayValue = objValue.replace(/./g, "*");
		console.log("[INFO] Injecting variable : " + prefix + ", value : " + objDisplayValue);
		tl.setVariable(prefix, objValue, true);
	}
	else{
		for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var element = obj[key];
                exportJSONValues(element, prefix + "_" + key);
            }
		}
	}

}

function getKVSecrets(site_url, token, ignore_ssl_errors){

	var strVariablePrefix = tl.getInput('strVariablePrefix', true);
	var strKVEnginePath = tl.getInput('strKVEnginePath', true);
	var kvVersion = tl.getInput('kvVersion', true);
	var strSecretPath = tl.getInput('strSecretPath', true);
	var strVariablePrefix = tl.getInput('strVariablePrefix', true);

	var restURL = null;

	switch(kvVersion){
		case "v1":
			restURL	= url.resolve(site_url,'/v1/' + strKVEnginePath + '/' + strSecretPath);
			break;
		case "v2":
			restURL	= url.resolve(site_url,'/v1/' + strKVEnginePath + '/data/' + strSecretPath);
			break;
		default:
			throw new Error("KV version not supported. v1 or v2 are supported.");
	}

	console.log("[INFO] REST API URL called : '" + restURL + "'");

	// Setup options for requests
	var protocol;
	var options = url.parse(restURL);

	// Set protocol and port in needed
	switch(options.protocol){
		case "https:":
			protocol = https;
			if(!options.port){
				options.port = 443;
			}
			if(ignore_ssl_errors){
				console.log("[INFO] Ignore certificate checks : 'True'");
				options.rejectUnhauthorized = false;
				process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			}
			else{
				console.log("[INFO] Ignore certificate checks : 'False'");
			}
			break;
		case "http:":
			protocol = http;
			if(!options.port){
				options.port = 80;
			}
			break;
		default:
			throw new Error("Protocol not supported. HTTP or HTTPS are supported.");
	}

	console.log("[INFO] KV engine path : '" + strKVEnginePath + "'");
	console.log("[INFO] KV version : '" + kvVersion + "'");
	console.log("[INFO] Secret path : '" + strSecretPath + "'");
	console.log("[INFO] Variable prefix : '" + strVariablePrefix + "'");

	// Set token in headers
	options.headers  = {
		"X-Vault-Token": token
	}

	console.log("[INFO] Starting requesting secret ...");
	var req = protocol.request(options, (res) => {

		var binaryData = new Stream();
		
		var statusCode = res.statusCode;
		
		res.on('data', function (d) {
			binaryData.push(d);
		});
		
		res.on('end', function (e) {

			var content = JSON.parse(binaryData.read());

			if(parseInt(statusCode) < 200 || parseInt(statusCode) > 299){
				throw new Error("Error when requesting Vault [" + statusCode + "] : \n" + JSON.stringify(content));
			}

			switch(kvVersion){
				case "v1":
					exportJSONValues(content.data, strVariablePrefix);
					break;
				case "v2":
					console.log("[INFO] Secret version : '" + content.data.metadata.version + "'");
					console.log("[INFO] Secret creation time : '" + content.data.metadata.created_time + "'");
					exportJSONValues(content.data.data, strVariablePrefix);
					break;
				default:
					throw new Error("KV version not supported. v1 or v2 are supported.");
			}
			
		});
		
		req.on('error', function catchError(error) {
			throw new Error("Error when requesting Vault [" + statusCode + "] : " + error);
		});
		
	});
	
	req.end();

}

function getTokenThenProcess(site_url, auth_url, ignore_ssl_errors, body_data){

	var protocol;
	var options = url.parse(auth_url);

	// Set protocol and port in needed
	switch(options.protocol){
		case "https:":
			protocol = https;
			if(!options.port){
				options.port = 443;
			}
			if(ignore_ssl_errors){
				console.log("[INFO] Ignore certificate checks : 'True'");
				options.rejectUnhauthorized = false;
				process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			}
			else{
				console.log("[INFO] Ignore certificate checks : 'False'");
			}
			break;
		case "http:":
			protocol = http;
			if(!options.port){
				options.port = 80;
			}
			break;
		default:
			throw new Error("Protocol not supported. HTTP or HTTPS are supported.");
	}

	// Set options
	var options = url.parse(auth_url);
	options.method = "POST";
	options.headers  = {
		'Content-Type': 'application/json',
		'Content-Length': body_data.length
	}
	console.log("[INFO] Starting requesting client token ...");
	var req = protocol.request(options, (res) => {
		
		var binaryData = new Stream();

		var statusCode = res.statusCode;
		
		res.on('data', function (d) {
			binaryData.push(d);
		});
		
		res.on('end', function (e) {

			var content = JSON.parse(binaryData.read());
			if(parseInt(statusCode) < 200 || parseInt(statusCode) > 299){

				throw new Error("Error when requesting Vault [" + statusCode + "] : \n" + JSON.stringify(content));
			}

			var token = content.auth.client_token;
			var lease_duration = content.lease_duration || content.auth.lease_duration;
			console.log("[INFO] Token received");
			console.log("[INFO] Token lease duration : '" + lease_duration + "'");
			getKVSecrets(site_url, token, ignore_ssl_errors);
			
		});
		
		req.on('error', function catchError(error) {
			throw new Error("Error when requesting Vault [" + statusCode + "] : " + error);
		});
	});
	req.write(body_data);
	req.end();

}

run();