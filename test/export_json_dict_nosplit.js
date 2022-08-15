const tmrm = require('azure-pipelines-task-lib/mock-run');
const path = require('path');

var taskPath = path.join(__dirname, '..', 'dist/test_json_pull/test_json_pull.js');
var conf = require(path.join(__dirname, 'conf.json'));

var tr = new tmrm.TaskMockRunner(taskPath);
tr.setInput("jsonFilePath", "test/vault_json/dict.json");
tr.setInput("strVariablePrefix",  "");
tr.setInput("replaceCR", false);
tr.setInput("strCRPrefix", "");
tr.setInput("objectSplit", false);
tr.setInput("objectSeperator", ".");
tr.registerMock('azure-pipelines-task-lib/toolrunner', require('azure-pipelines-task-lib/mock-toolrunner'));
tr.run()