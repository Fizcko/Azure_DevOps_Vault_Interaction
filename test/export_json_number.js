const tmrm = require('azure-pipelines-task-lib/mock-run');
const path = require('path');

var taskPath = path.join(__dirname, '..', 'dist/test_json_pull/test_json_pull.js');
var conf = require(path.join(__dirname, 'conf.json'));

var tr = new tmrm.TaskMockRunner(taskPath);
tr.setInput("jsonFilePath", "test/vault_json/number.json");
tr.setInput("strVariablePrefix", conf.kv_read.strVariablePrefix ? conf.kv_read.strVariablePrefix : "");
tr.setInput("replaceCR", conf.kv_read.replaceCR ? conf.kv_read.replaceCR : false);
tr.setInput("strCRPrefix", conf.kv_read.strCRPrefix ? conf.kv_read.strCRPrefix : "");
tr.setInput("objectSplit", conf.kv_read.objectSplit ? conf.kv_read.objectSplit : false);
tr.setInput("objectSeperator", conf.kv_read.objectSeperator ? conf.kv_read.objectSeperator : "");
tr.registerMock('azure-pipelines-task-lib/toolrunner', require('azure-pipelines-task-lib/mock-toolrunner'));
tr.run()