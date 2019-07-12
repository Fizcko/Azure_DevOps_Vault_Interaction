import tl = require('azure-pipelines-task-lib/task');
const url = require('url');
const path = require('path');
import {getToken,requestVault} from './common/request';
import {exportJSONValues} from './common/utils';

async function run() {
	
	try {

		tl.setResourcePath(path.join(__dirname, 'task.json'));

		var strUrl = tl.getInput('strUrl', true);
		var ignoreCertificateChecks = tl.getBoolInput('ignoreCertificateChecks', true);

		var strVariablePrefix = tl.getInput('strVariablePrefix', true);
		var strKVEnginePath = tl.getInput('strKVEnginePath', true);
		var kvVersion = tl.getInput('kvVersion', true);
		var strSecretPath = tl.getInput('strSecretPath', true);
		var strVariablePrefix = tl.getInput('strVariablePrefix', true);

		console.log("[INFO] Vault URL : '" + strUrl + "'");

		getToken().then(async function(token) {
			
			var restURL = null;

			switch(kvVersion){
				case "v1":
					restURL	= url.resolve(strUrl,'/v1/' + strKVEnginePath + '/' + strSecretPath);
					break;
				case "v2":
					restURL	= url.resolve(strUrl,'/v1/' + strKVEnginePath + '/data/' + strSecretPath);
					break;
				default:
					throw new Error("KV version not supported. v1 or v2 are supported.");
			}

			console.log("[INFO] REST API URL called : '" + restURL + "'");

			requestVault(restURL, ignoreCertificateChecks, token, "GET", null).then(async function(result) {

				console.log("[INFO] KV engine path : '" + strKVEnginePath + "'");
				console.log("[INFO] KV version : '" + kvVersion + "'");
				console.log("[INFO] Secret path : '" + strSecretPath + "'");
				console.log("[INFO] Variable prefix : '" + strVariablePrefix + "'");

				var resultJSON = JSON.parse(result);

				switch(kvVersion){
					case "v1":
						await exportJSONValues(resultJSON.data, strVariablePrefix);
						break;
					case "v2":
						console.log("[INFO] Secret version : '" + resultJSON.data.metadata.version + "'");
						console.log("[INFO] Secret creation time : '" + resultJSON.data.metadata.created_time + "'");
						await exportJSONValues(resultJSON.data.data, strVariablePrefix);
						break;
					default:
						throw new Error("KV version not supported. v1 or v2 are supported.");
				}

				tl.setResult(tl.TaskResult.Succeeded, "Wrapping successfull.");

			}).catch(function(err) {
				tl.setResult(tl.TaskResult.Failed, err);
				throw new Error(err);
			});
			

		}).catch(function(err) {
			tl.setResult(tl.TaskResult.Failed, err);
			throw new Error(err);
		});

	} catch (err) {
		tl.setResult(tl.TaskResult.Failed, err);
	}
	
}

run();