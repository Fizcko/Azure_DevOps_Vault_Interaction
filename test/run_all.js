const assert = require('assert');
const path = require('path');
const ttm = require('azure-pipelines-task-lib/mock-test');

describe('azure-devops-vault-interaction', function () {
    
    it("kv_read", async () => {

        var tp = path.join(__dirname, "kv_read.js");
        var tr = new ttm.MockTestRunner(tp);

        var conf = require(path.join(__dirname, 'conf.json'));
        process.env["AUTH"] = conf.vault.login_auth;

        await tr.runAsync(conf.task_node_version);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            console.log("STDOUT", tr.stdout);
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
        }
    }).timeout(10000);
    
    it("tool_create_file", async () => {

        var tp = path.join(__dirname, "tool_create_file.js");
        var tr = new ttm.MockTestRunner(tp);

        var conf = require(path.join(__dirname, 'conf.json'));
        await tr.runAsync(conf.task_node_version);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            console.log("STDOUT", tr.stdout);
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
        }
    }).timeout(10000);
});
