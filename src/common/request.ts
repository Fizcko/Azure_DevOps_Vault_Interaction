import tl = require('azure-pipelines-task-lib/task');
const url = require('url');
const http = require('http');
const https = require("https");
const Stream = require('stream').Transform;
const axios = require('axios');

export function requestVault(requestedUrl: string, ignoreCertificateChecks: boolean, strRequestTimeout: string, token: string, methode: string, body: string): Promise<any> {
    return new Promise((resolve, reject) => {

        var strNamespaces = tl.getInput('strNamespaces', false);
        var useProxy = tl.getInput('useProxy', true);
        if(useProxy != "none"){
			var strProxyHost = tl.getInput('strProxyHost', true);
			var strProxyPort = tl.getInput('strProxyPort', true);
		}

        // Setup options for axios request
        var options = {};

        if(!strNamespaces){
			strNamespaces = "";
        }

        if(useProxy == "none"){
            options["proxy"] = false;
        }        
        else {
            options["proxy"] = {
                protocol: useProxy,
                host: strProxyHost,
                port: strProxyPort
            };
        }

        options["url"] = String(requestedUrl);
        
        var agentHTTP = new http.Agent({ 
            keepAlive: true 
        });

        var agentHTTPS = new https.Agent({ 
            keepAlive: true 
        });

        if(ignoreCertificateChecks){
            console.log("[INFO] Ignore certificate checks : 'True'");
            agentHTTPS = new https.Agent({ 
                keepAlive: true,
                rejectUnauthorized: false
            });
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }
        else{
            console.log("[INFO] Ignore certificate checks : 'False'");
        }

        options["httpAgent"] = agentHTTP;
        options["httpsAgent"] = agentHTTPS;

        // Set token in headers
        if(body){
            options["data"] = body;
            options["headers"]  = {
                'Content-Type': 'application/json',
                'Content-Length': body.length,
                "X-Vault-Token": token
            }
        }
        else{
            options["headers"]  = {
                "X-Vault-Token": token
            }
        }

        // Set timeout
        if(strRequestTimeout){
            options["timeout"] = Number(strRequestTimeout);
        }

        // Set methode
        switch(methode){
            case "post":
            case "POST":
                options["method"] = "POST";
                break;
            case "list":
            case "LIST":
                options["method"] = "LIST";
                    break;
            default:
            case "get":
            case "GET":
                options["method"] = "GET";
                break;
        }

        // Set namespaces
        if(strNamespaces){
            options["headers"]["X-Vault-Namespace"] = strNamespaces
        }

        axios.request(options).then(function (response) {

            try{
                var statusCode = response.status;
                var content = response.data;
            } catch (err) {
                reject("Error when converting JSON return. " + err);
            }

            if(parseInt(statusCode) < 200 || parseInt(statusCode) > 299){
                reject("Error when requesting Vault [" + statusCode + "] : \n" + content);
            }

            resolve(content);

        }).catch(function (err) {
            if(err.response && err.response.data)
                reject("Error during the request " + JSON.stringify(err.response.data));
            else
                reject("Error during the request.");
        });

    });
}

export function getToken(strRequestTimeout): Promise<string> {
    return new Promise((resolve, reject) => {

        var strUrl;
        var serverEndpointAuth;
        var overloadFromServiceConnection = false;

		var strAuthType = tl.getInput('strAuthType', true);
        
		if(strAuthType == "serviceConnection"){
			var serviceConnectionValues = tl.getInput('serviceConnectionName',true);
			strUrl = tl.getEndpointUrl(serviceConnectionValues, false);
            serverEndpointAuth = tl.getEndpointAuthorization(serviceConnectionValues, false);
            strAuthType = serverEndpointAuth["parameters"]["authType"];
            overloadFromServiceConnection = true;

            // Export Service Connection Settings
            var boolExportServiceConnectionSettings = tl.getBoolInput('exportServiceConnectionSettings', true);
            if(boolExportServiceConnectionSettings == true){
                var strUsername = serverEndpointAuth["parameters"]["username"];
                var strPassword = serverEndpointAuth["parameters"]["password"];
                tl.setVariable("url", strUrl, false, true); 
                tl.setVariable("username", strUsername, false, true); 
                tl.setVariable("password", strPassword, true, true);
            }
            
		}
		else{
			strUrl = tl.getInput('strUrl', true);
		}
        var ignoreCertificateChecks = tl.getBoolInput('ignoreCertificateChecks', true);

        var authUrl = null;
        var bodyData = null;

        switch(strAuthType){			
			case "approle":
                console.log("[INFO] Authentication Method : 'AppRole'");

                var strAuthPath = tl.getInput('strAuthPath', false);
                var apiURL = "/v1/auth/approle/login";
                if(strAuthPath){
                    apiURL = "/v1/auth/" + strAuthPath + "/login";
                }

                var strRoleID;
                var strSecretID;

                if(overloadFromServiceConnection){
                    strRoleID = serverEndpointAuth["parameters"]["username"];
                    strSecretID = serverEndpointAuth["parameters"]["password"];
                }
                else{
                    strRoleID = tl.getInput('strRoleID', true);
                    strSecretID = tl.getInput('strSecretID', true);
                }

				authUrl = url.resolve(strUrl,apiURL);
				bodyData = JSON.stringify({
					role_id: strRoleID,
					secret_id: strSecretID
				});		
                break;
            case "azure":
                console.log("[INFO] Authentication Method : 'Azure'");

                var strAuthPath = tl.getInput('strAuthPath', false);
                var apiURL = "/v1/auth/azure/login";
                if(strAuthPath){
                    apiURL = "/v1/auth/" + strAuthPath + "/login";
                }

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
                
				authUrl = url.resolve(strUrl,apiURL);
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

                var strToken;

                if(overloadFromServiceConnection){
                    strToken = serverEndpointAuth["parameters"]["password"];
                }
                else{
                    strToken = tl.getInput('strToken', true);
                }
                resolve(strToken);
                break;
            case "ldap":
                console.log("[INFO] Authentication Method : 'LDAP'");
                var strAuthPath = tl.getInput('strAuthPath', false);
                var apiURL = "/v1/auth/ldap/login/";
                if(strAuthPath){
                    apiURL = "/v1/auth/" + strAuthPath + "/login/";
                }

                var strUsername;
                var strPassword;

                if(overloadFromServiceConnection){
                    strUsername = serverEndpointAuth["parameters"]["username"];
                    strPassword = serverEndpointAuth["parameters"]["password"];
                }
                else{
                    strUsername = tl.getInput('strUsername', true);
                    strPassword = tl.getInput('strPassword', true);
                }

				authUrl = url.resolve(strUrl,apiURL + strUsername);
				bodyData = JSON.stringify({
					password: strPassword
				});				
                break;
            case "radius":
                console.log("[INFO] Authentication Method : 'Radius'");
                var strAuthPath = tl.getInput('strAuthPath', false);
                var apiURL = "/v1/auth/radius/login/";
                if(strAuthPath){
                    apiURL = "/v1/auth/" + strAuthPath + "/login/";
                }
                
                var strUsername;
                var strPassword;

                if(overloadFromServiceConnection){
                    strUsername = serverEndpointAuth["parameters"]["username"];
                    strPassword = serverEndpointAuth["parameters"]["password"];
                }
                else{
                    strUsername = tl.getInput('strUsername', true);
                    strPassword = tl.getInput('strPassword', true);
                }

				authUrl = url.resolve(strUrl,apiURL + strUsername);
				bodyData = JSON.stringify({
					password: strPassword
				});				
                break;
            case "userpass":
                console.log("[INFO] Authentication Method : 'Username & Password'");
                var strAuthPath = tl.getInput('strAuthPath', false);
                var apiURL = "/v1/auth/userpass/login/";
                if(strAuthPath){
                    apiURL = "/v1/auth/" + strAuthPath + "/login/";
                }
                
                var strUsername;
                var strPassword;

                if(overloadFromServiceConnection){
                    strUsername = serverEndpointAuth["parameters"]["username"];
                    strPassword = serverEndpointAuth["parameters"]["password"];
                }
                else{
                    strUsername = tl.getInput('strUsername', true);
                    strPassword = tl.getInput('strPassword', true);
                }
                
				authUrl = url.resolve(strUrl,apiURL + strUsername);
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

        requestVault(authUrl, ignoreCertificateChecks, strRequestTimeout, null, "POST", bodyData).then(async function(result) {

            var resultJSON = result;
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