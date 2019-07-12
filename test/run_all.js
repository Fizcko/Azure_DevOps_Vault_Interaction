const assert = require('assert');
const path = require('path');
const ttm = require('azure-pipelines-task-lib/mock-test');

describe('azure-devops-vault-interaction', function () {
    it("kv_read", (done) => {

        var tp = path.join(__dirname, "kv_read.js");
        var tr = new ttm.MockTestRunner(tp);

        var conf = require(path.join(__dirname, 'conf.json'));
        process.env["AUTH"] = conf.vault.login_auth;

        tr.run();
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    });
});
