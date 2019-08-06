const tmrm = require('azure-pipelines-task-lib/mock-run');
const path = require('path');

var taskPath = path.join(__dirname, '..', 'dist/kv_read/kv_read.js');
var conf = require(path.join(__dirname, 'conf.json'));

var tr = new tmrm.TaskMockRunner(taskPath);

tr.setInput("strUrl", conf.vault.url);
tr.setInput("ignoreCertificateChecks", conf.vault.ignore_ssl);

var strAuthType = process.env["AUTH"];

switch(strAuthType){			
    case "approle":
        tr.setInput("strAuthType", "approle");
        tr.setInput("strRoleID", conf.auth.approle.strRoleID);
        tr.setInput("strSecretID", conf.auth.approle.strSecretID);
        break;
    case "azure":
        tr.setInput("strAuthType", "azure");
        tr.setInput("strRole", conf.auth.azure.strRole);
        tr.setInput("strJWT", conf.auth.azure.strJWT);
        tr.setInput("strSubscriptionID", conf.auth.azure.strSubscriptionID);
        tr.setInput("strResourceGroupName", conf.auth.azure.strResourceGroupName);
        tr.setInput("strVmName", conf.auth.azure.strVmName);
        tr.setInput("strVmssName", conf.auth.azure.strVmssName);
        break;
    case "clientToken":
        tr.setInput("strAuthType", "clientToken");
        tr.setInput("strToken", conf.auth.clientToken.strToken);
        break;
    case "ldap":
        tr.setInput("strAuthType", "ldap");
        tr.setInput("strUsername", conf.auth.ldap.strUsername);
        tr.setInput("strPassword", conf.auth.ldap.strPassword);
        break;
    case "radius":
        tr.setInput("strAuthType", "radius");
        tr.setInput("strUsername", conf.auth.radius.strUsername);
        tr.setInput("strPassword", conf.auth.radius.strPassword);
        break;
    case "userpass":
        tr.setInput("strAuthType", "userpass");
        tr.setInput("strUsername", conf.auth.userpass.strUsername);
        tr.setInput("strPassword", conf.auth.userpass.strPassword);
        break;
}

tr.setInput("strKVEnginePath", conf.kv_read.strKVEnginePath);
tr.setInput("kvVersion", conf.kv_read.kvVersion);
tr.setInput("strSecretPath", conf.kv_read.strSecretPath);
tr.setInput("strVariablePrefix", conf.kv_read.strVariablePrefix ? conf.kv_read.strVariablePrefix : "");
tr.setInput("strPrefixType", conf.kv_read.strPrefixType);
tr.setInput("strSecretPath", conf.kv_read.strSecretPath ? conf.kv_read.strSecretPath : "");

tr.registerMock('azure-pipelines-task-lib/toolrunner', require('azure-pipelines-task-lib/mock-toolrunner'));
tr.run();