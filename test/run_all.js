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
            console.log("STDOUT", tr.stdout);
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
    
    it("tool_create_file", (done) => {

        var tp = path.join(__dirname, "tool_create_file.js");
        var tr = new ttm.MockTestRunner(tp);

        tr.run();
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            console.log("STDOUT", tr.stdout);
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
    
    it("export_json_string", (done) => {

        var tp = path.join(__dirname, "export_json_string.js");
        var tr = new ttm.MockTestRunner(tp);

        tr.run();
        console.log(tr.failed);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            assert(tr.stdOutContained("task.setvariable variable=xxx_test;isOutput=false;issecret=true;]test_value"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test2;isOutput=false;issecret=true;]test_value2"))
            console.log("STDOUT", tr.stdout);
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
    it("export_json_number", (done) => {

        var tp = path.join(__dirname, "export_json_number.js");
        var tr = new ttm.MockTestRunner(tp);

        tr.run();
        console.log(tr.failed);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            assert(tr.stdOutContained("task.setvariable variable=xxx_test;isOutput=false;issecret=true;]1"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test2;isOutput=false;issecret=true;]3"))
            console.log("STDOUT", tr.stdout);
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
    it("export_json_boolean", (done) => {

        var tp = path.join(__dirname, "export_json_boolean.js");
        var tr = new ttm.MockTestRunner(tp);

        tr.run();
        console.log(tr.failed);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            assert(tr.stdOutContained("task.setvariable variable=xxx_test;isOutput=false;issecret=true;]true"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test2;isOutput=false;issecret=true;]false"))
            console.log("STDOUT", tr.stdout);
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
    it("export_json_array_nosplit", (done) => {

        var tp = path.join(__dirname, "export_json_array_nosplit.js");
        var tr = new ttm.MockTestRunner(tp);

        tr.run();
        console.log(tr.failed);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            console.log("STDOUT", tr.stdout);
            assert(tr.stdOutContained("task.setvariable variable=xxx_test;isOutput=false;issecret=true;][\"test value\",1,2,3,4]"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test2;isOutput=false;issecret=true;][\"tree\"]"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_embedded;isOutput=false;issecret=true;][[0,2],[1,2]]"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_embeddedDict;isOutput=false;issecret=true;][{\"foo\":\"bar\",\"one\":2}]"))
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
    it("export_json_array_split", (done) => {

        var tp = path.join(__dirname, "export_json_array_split.js");
        var tr = new ttm.MockTestRunner(tp);

        tr.run();
        console.log(tr.failed);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            console.log("STDOUT", tr.stdout);
            assert(tr.stdOutContained("task.setvariable variable=xxx_test,0;isOutput=false;issecret=true;]test value"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test,1;isOutput=false;issecret=true;]1"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test,2;isOutput=false;issecret=true;]2"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test,3;isOutput=false;issecret=true;]3"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test,4;isOutput=false;issecret=true;]4"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_test2,0;isOutput=false;issecret=true;]tree"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_embedded,0,0;isOutput=false;issecret=true;]0"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_embedded,0,1;isOutput=false;issecret=true;]2"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_embedded,1,0;isOutput=false;issecret=true;]1"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_embedded,1,1;isOutput=false;issecret=true;]2"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_embeddedDict,0,foo;isOutput=false;issecret=true;]bar"))
            assert(tr.stdOutContained("task.setvariable variable=xxx_embeddedDict,0,one;isOutput=false;issecret=true;]2"))
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
    it("export_json_dict_split", (done) => {

        var tp = path.join(__dirname, "export_json_dict_split.js");
        var tr = new ttm.MockTestRunner(tp);

        tr.run();
        console.log(tr.failed);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            console.log("STDOUT", tr.stdout);
            assert(tr.stdOutContained("task.setvariable variable=test.test;isOutput=false;issecret=true;]key"))
            assert(tr.stdOutContained("task.setvariable variable=test.num;isOutput=false;issecret=true;]1"))
            assert(tr.stdOutContained("task.setvariable variable=test.boolean;isOutput=false;issecret=true;]true"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedDict.test.foo;isOutput=false;issecret=true;]bar"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedDict.test.one;isOutput=false;issecret=true;]2"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedDict.hi;isOutput=false;issecret=true;]hello"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedArray.test.0;isOutput=false;issecret=true;]1"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedArray.test.1;isOutput=false;issecret=true;]test"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedArray.test.2;isOutput=false;issecret=true;]false"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedArray.hi.test.0;isOutput=false;issecret=true;]1"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedArray.hi.test.1;isOutput=false;issecret=true;]3"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedArray.hi.test.2;isOutput=false;issecret=true;]2"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedArray.hi.test.3;isOutput=false;issecret=true;]4"))
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
    it("export_json_dict_nosplit", (done) => {

        var tp = path.join(__dirname, "export_json_dict_nosplit.js");
        var tr = new ttm.MockTestRunner(tp);

        tr.run();
        console.log(tr.failed);
        
        try {
            assert(tr.succeeded, "Should have succeeded");
            console.log("STDOUT", tr.stdout);
            assert(tr.stdOutContained("task.setvariable variable=test;isOutput=false;issecret=true;]{\"test\":\"key\",\"num\":1,\"boolean\":true}"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedDict;isOutput=false;issecret=true;]{\"test\":{\"foo\":\"bar\",\"one\":2},\"hi\":\"hello\"}"))
            assert(tr.stdOutContained("task.setvariable variable=embeddedArray;isOutput=false;issecret=true;]{\"test\":[1,\"test\",false],\"hi\":{\"test\":[1,3,2,4]}}"))
            done();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            done(error);
        }
    }).timeout(10000);
});
