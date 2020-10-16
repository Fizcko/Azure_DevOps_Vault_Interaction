const tmrm = require('azure-pipelines-task-lib/mock-run');
const path = require('path');

var taskPath = path.join(__dirname, '..', 'dist/tool_create_file/tool_create_file.js');
var conf = require(path.join(__dirname, 'conf.json'));

var tr = new tmrm.TaskMockRunner(taskPath);

tr.setInput("targetDirectory", conf.tool_create_file.targetDirectory);
tr.setInput("targetName", conf.tool_create_file.targetName);
tr.setInput("fileContent", conf.tool_create_file.fileContent);
tr.setInput("fileEncoding", conf.tool_create_file.fileEncoding);
tr.setInput("actionType", conf.tool_create_file.actionType);

if(conf.tool_create_file.actionType == "replaceToken"){
    tr.setInput("actionToken", conf.tool_create_file.actionToken);
    tr.setInput("actionNewLineType", conf.tool_create_file.actionNewLineType);
}

tr.registerMock('azure-pipelines-task-lib/toolrunner', require('azure-pipelines-task-lib/mock-toolrunner'));
tr.run();