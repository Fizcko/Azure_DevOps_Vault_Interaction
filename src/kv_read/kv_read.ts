import tl = require('azure-pipelines-task-lib/task');
const url = require('url');
const path = require('path');
import {getToken,requestVault} from './common/request';
import {exportJSONValues} from './common/utils';

async function run() {
	
	try {

		tl.setResourcePath(path.join(__dirname, 'task.json'));

		var strUrl;
		var strAuthType = tl.getInput('strAuthType', true);
		if(strAuthType == "serviceConnection"){
			var serviceConnectionValues = tl.getInput('serviceConnectionName',true);
			strUrl = tl.getEndpointUrl(serviceConnectionValues, false);
		}
		else{
			strUrl = tl.getInput('strUrl', true);
		}

		var ignoreCertificateChecks = tl.getBoolInput('ignoreCertificateChecks', true);
		var useProxy = tl.getInput('useProxy', true);
		var strRequestTimeout = tl.getInput('strRequestTimeout', false);

		var strKVEnginePath = tl.getInput('strKVEnginePath', true);
		var kvVersion = tl.getInput('kvVersion', true);
		var strSecretPath = tl.getInput('strSecretPath', false);
		var strPrefixType = tl.getInput('strPrefixType', true);
		var strVariablePrefix = tl.getInput('strVariablePrefix', false);
		var replaceCR = tl.getBoolInput('replaceCR', true);
		var strNamespaces = tl.getInput('strNamespaces', false);
		
		if(replaceCR){
			var strCRPrefix = tl.getInput('strCRPrefix', true);
		}
		if(useProxy != "none"){
			var strProxyHost = tl.getInput('strProxyHost', true);
			var strProxyPort = tl.getInput('strProxyPort', true);
		}
		if(!strSecretPath){
			strSecretPath = "";
		}
		if(!strVariablePrefix){
			strVariablePrefix = "";
		}
		if(!strRequestTimeout){
			strRequestTimeout = "";
		}
		if(!strNamespaces){
			strNamespaces = "";
		}
		if(isNaN(Number(strRequestTimeout))){
			throw new Error("The field 'Request timeout' is not a number.");
		}

		console.log("[INFO] Vault URL : '" + strUrl + "'");
		if(strAuthType == "serviceConnection"){
			var boolExportServiceConnectionSettings = tl.getBoolInput('exportServiceConnectionSettings', true);
			if(boolExportServiceConnectionSettings){
				console.log("[INFO] Service Connection settings are exported as output variables.");
			}
		}
		console.log("[INFO] Use proxy : '" + useProxy + "'");
		if(useProxy != "none"){
			console.log("[INFO] Proxy settings : '" + strProxyHost + ":" + strProxyPort + "'");
		}
		if(strNamespaces){
			console.log("[INFO] Namespaces : '" + strNamespaces + "'");
		}

		getToken(strRequestTimeout).then(async function(token) {

			console.log("[INFO] KV engine path : '" + strKVEnginePath + "'");
			console.log("[INFO] KV version : '" + kvVersion + "'");
			console.log("[INFO] Secret path : '" + strSecretPath + "'");
			console.log("[INFO] Variable prefix : '" + strVariablePrefix + "'");
			if(replaceCR){
				console.log("[INFO] All carriage return will be replaced  by: '" + strCRPrefix + "'");
			}
			console.log(" ");

			if(strSecretPath.match(/.*\/$/)){
				browseEngineAndGetSecrets(kvVersion, strUrl, ignoreCertificateChecks, strRequestTimeout, token, strKVEnginePath, strSecretPath, strPrefixType, strVariablePrefix, replaceCR, strCRPrefix).then(function(result) {
					tl.setResult(tl.TaskResult.Succeeded, "Wrapping successfull.");
				}).catch(function(err) {
					tl.setResult(tl.TaskResult.Failed, err);
					throw new Error(err);
				});	
			}
			else{
				getSecrets(kvVersion, strUrl, ignoreCertificateChecks, strRequestTimeout, token, strKVEnginePath, strSecretPath, strPrefixType, strVariablePrefix, replaceCR, strCRPrefix).then(function(result) {
					tl.setResult(tl.TaskResult.Succeeded, "Wrapping successfull.");
				}).catch(function(err) {
					tl.setResult(tl.TaskResult.Failed, err);
					throw new Error(err);
				});	
			}

		}).catch(function(err) {
			tl.setResult(tl.TaskResult.Failed, err);
			throw new Error(err);
		});

	} catch (err) {
		tl.setResult(tl.TaskResult.Failed, err);
	}
	
}

async function browseEngineAndGetSecrets(kvVersion, strUrl, ignoreCertificateChecks, strRequestTimeout, token, strKVEnginePath, strSecretPath, strPrefixType, strVariablePrefix, replaceCR, strCRPrefix){

	return new Promise(async (resolve, reject) => {

		var listURL = null;

		if(strSecretPath == "/"){
			strSecretPath = "";
		}
		else if(strSecretPath.match(/^\/.*/)){
			strSecretPath = strSecretPath.substr(1);
		}
		
		switch(kvVersion){
			case "v1":
				listURL	= url.resolve(strUrl,path.normalize('/v1/' + strKVEnginePath + '/' + strSecretPath));
				break;
			case "v2":
				listURL	= url.resolve(strUrl,path.normalize('/v1/' + strKVEnginePath + '/metadata/' + strSecretPath));
				break;
			default:
				throw new Error("KV version not supported. v1 or v2 are supported.");
		}

		console.log("[INFO] Browse engine URL requested : [LIST] '" + listURL + "'");

		await requestVault(String(listURL), ignoreCertificateChecks, strRequestTimeout, token, "LIST", null).then(async function(result) {

			var resultJSON = result;

			for (var i = 0; i < resultJSON.data.keys.length; i++) {
				try{

					var newStrSecretPath = strSecretPath + "/" + resultJSON.data.keys[i];
					if(strSecretPath.match(/.*\/$/) || strSecretPath == ""){
						newStrSecretPath = strSecretPath + resultJSON.data.keys[i];
					}
					

					if(resultJSON.data.keys[i].match(/.*\/$/)){
						await browseEngineAndGetSecrets(kvVersion, strUrl, ignoreCertificateChecks, strRequestTimeout, token, strKVEnginePath, newStrSecretPath, strPrefixType, strVariablePrefix, replaceCR, strCRPrefix);
					}
					else{
						await getSecrets(kvVersion, strUrl, ignoreCertificateChecks, strRequestTimeout, token, strKVEnginePath, newStrSecretPath, strPrefixType, strVariablePrefix, replaceCR, strCRPrefix);
					}
				}
				catch(err){
					reject("Error during browsing engine. " + err);
				}
			}

			resolve(true);

		}).catch(function(err) {
			reject("Error during browsing engine. " + err);
		});
	});

}

async function getSecrets(kvVersion, strUrl, ignoreCertificateChecks, strRequestTimeout, token, strKVEnginePath, strSecretPath, strPrefixType, strVariablePrefix, replaceCR, strCRPrefix){

	var getURL = null;

	switch(strPrefixType){
		case "folder":
			strVariablePrefix = strSecretPath.replace("/","_");
			break;
		case "custom":
			strVariablePrefix = strVariablePrefix;
			break;
		case "none":
		default:
			strVariablePrefix = "";
	}

	switch(kvVersion){
		case "v1":
			getURL	= url.resolve(strUrl,path.normalize('/v1/' + strKVEnginePath + '/' + strSecretPath));
			break;
		case "v2":
			getURL	= url.resolve(strUrl,path.normalize('/v1/' + strKVEnginePath + '/data/' + strSecretPath));
			break;
		default:
			throw new Error("KV version not supported. v1 or v2 are supported.");
	}

	console.log("[INFO] Get secrets URL requested : [GET] '" + getURL + "'");

	return new Promise(async (resolve, reject) => {

		requestVault(String(getURL), ignoreCertificateChecks, strRequestTimeout, token, "GET", null).then(async function(result) {

			var resultJSON = result;

			try{
				switch(kvVersion){
					case "v1":
						await exportJSONValues(resultJSON.data, strVariablePrefix, replaceCR, strCRPrefix);
						break;
					case "v2":
						console.log("[INFO] Secret version : '" + resultJSON.data.metadata.version + "'");
						console.log("[INFO] Secret creation time : '" + resultJSON.data.metadata.created_time + "'");
						await exportJSONValues(resultJSON.data.data, strVariablePrefix, replaceCR, strCRPrefix);
						break;
					default:
						throw new Error("KV version not supported. v1 or v2 are supported.");
				}
			}
			catch(err){
				reject(err);
			}

			console.log(" ");
			resolve(true);

		}).catch(function(err) {
			reject("Error when get secrets. " + err);
		});

	});

}

run();