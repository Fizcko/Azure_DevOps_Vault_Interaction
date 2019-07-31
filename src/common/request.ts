import tl = require('azure-pipelines-task-lib/task');
const url = require('url');
const http = require('http');
const https = require("https");
const Stream = require('stream').Transform;

export function requestVault(requestedUrl: string, ignoreCertificateChecks: boolean, token: string, methode: string, body: string): Promise<string> {
    return new Promise((resolve, reject) => {

        // Setup options for requests
        var protocol;
        var options = url.parse(requestedUrl);

        // Set protocol and port in needed
        switch(options.protocol){
            case "https:":
                protocol = https;
                if(!options.port){
                    options.port = 443;
                }
                if(ignoreCertificateChecks){
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
                reject("Protocol not supported. HTTP or HTTPS are supported.");
        }

        // Set token in headers
        if(body){
            options.headers  = {
                'Content-Type': 'application/json',
                'Content-Length': body.length,
                "X-Vault-Token": token
            }
        }
        else{
            options.headers  = {
                "X-Vault-Token": token
            }
        }

        // Set methode
        switch(methode){
            case "post":
            case "POST":
                options.method = "POST";
                break;
            case "list":
            case "LIST":
                    options.method = "LIST";
                    break;
            default:
            case "get":
            case "GET":
                options.method = "GET";
                break;
        }

        var req = protocol.request(options, (res) => {

            var binaryData = new Stream();
            
            var statusCode = res.statusCode;
            
            res.on('data', function (d) {
                binaryData.push(d);
            });
            
            res.on('end', function (e) {

                try{
                    var content = JSON.stringify(JSON.parse(binaryData.read()));
                } catch (err) {
                    reject("Error when converting JSON return. " + err);
                }
                

                if(parseInt(statusCode) < 200 || parseInt(statusCode) > 299){
                    reject("Error when requesting Vault [" + statusCode + "] : \n" + content);
                }

                resolve(content);
                
            });
            
        }).on('error', function catchError(error) {
            reject("Error when requesting Vault '" + requestedUrl + "' : " + error);
        });
        
        if(body){
            req.write(body);
        }
        req.end();
    });
}

export function getToken(): Promise<string> {
    return new Promise((resolve, reject) => {

        var strUrl = tl.getInput('strUrl', true);
		var strAuthType = tl.getInput('strAuthType', true);
		var ignoreCertificateChecks = tl.getBoolInput('ignoreCertificateChecks', true);

        var authUrl = null;
        var bodyData = null;

        switch(strAuthType){			
			case "approle":
                console.log("[INFO] Authentication Method : 'AppRole'");

                var strRoleID = tl.getInput('strRoleID', true);
                var strSecretID = tl.getInput('strSecretID', true);

				authUrl = url.resolve(strUrl,'/v1/auth/approle/login');
				bodyData = JSON.stringify({
					role_id: strRoleID,
					secret_id: strSecretID
				});		
                break;
            case "azure":
                console.log("[INFO] Authentication Method : 'Azure'");

                var strRole = tl.getInput('strRole', true);
                var strJWT = tl.getInput('strJWT', true);

                var strSubscriptionID = tl.getInput('strSubscriptionID', false);
                strSubscriptionID = strSubscriptionID ? strSubscriptionID : "";

                var strResourceGroupName  = tl.getInput('strResourceGroupName', false);
                strResourceGroupName = strResourceGroupName ? strResourceGroupName : "";

                var strVmName  = tl.getInput('strVmName', false);
                strVmName = strVmName ? strVmName : "";

                var strVmssName = tl.getInput('strVmssName', false);
                strVmssName = strVmssName ? strVmssName : "";
                
				authUrl = url.resolve(strUrl,'/v1/auth/azure/login');
				bodyData = JSON.stringify({
					role: strRole,
					jwt: strJWT,
					subscription_id: strSubscriptionID,
					resource_group_name: strResourceGroupName,
					vm_name: strVmName,
					vmss_name: strVmssName
				});		
                break;
            case "clientToken":
                console.log("[INFO] Authentication Method : 'Client Token'");
                var strToken = tl.getInput('strToken', true);
                resolve(strToken);
                break;
            case "ldap":
                console.log("[INFO] Authentication Method : 'LDAP'");
                var strUsername = tl.getInput('strUsername', true);
		        var strPassword = tl.getInput('strPassword', true);
				authUrl = url.resolve(strUrl,'/v1/auth/ldap/login/' + strUsername);
				bodyData = JSON.stringify({
					password: strPassword
				});				
                break;
            case "radius":
                console.log("[INFO] Authentication Method : 'Radius'");
                var strUsername = tl.getInput('strUsername', true);
		        var strPassword = tl.getInput('strPassword', true);
				authUrl = url.resolve(strUrl,'/v1/auth/radius/login/' + strUsername);
				bodyData = JSON.stringify({
					password: strPassword
				});				
                break;
            case "userpass":
                console.log("[INFO] Authentication Method : 'Username & Password'");
                var strUsername = tl.getInput('strUsername', true);
		        var strPassword = tl.getInput('strPassword', true);
				authUrl = url.resolve(strUrl,'/v1/auth/userpass/login/' + strUsername);
				bodyData = JSON.stringify({
					password: strPassword
				});		
				break;
			default:
                reject("Authentication method not supported.");
		}
        
        if(strAuthType != "clientToken"){
            console.log("[INFO] Authentication URL : '" + authUrl + "'");
            console.log("[INFO] Starting requesting client token ...");
        }

        requestVault(authUrl, ignoreCertificateChecks, null, "POST", bodyData).then(async function(result) {

            var resultJSON = JSON.parse(result);
            var token = resultJSON.auth.client_token;
            var lease_duration = resultJSON.lease_duration || resultJSON.auth.lease_duration;

            console.log("[INFO] Token received");
            console.log("[INFO] Token lease duration : '" + lease_duration + "'");

            resolve(token);

        }).catch(function(err) {
			reject(err);
		});

    });
}