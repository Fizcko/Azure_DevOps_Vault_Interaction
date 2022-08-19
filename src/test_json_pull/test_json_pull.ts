import tl = require('azure-pipelines-task-lib/task');
const url = require('url');
const path = require('path');
// import {getToken,requestVault} from './common/request';
import {exportJSONValues} from '../kv_read/common/utils';
import * as fs from 'fs';

async function run() {
	
	try {
		var jsonFilePath = tl.getInput('jsonFilePath', true);
		var strVariablePrefix = tl.getInput('strVariablePrefix', false);
		var replaceCR = tl.getBoolInput('replaceCR', true);
		var objectSplit = tl.getBoolInput('objectSplit', true);
		var objectSeperator = tl.getInput('objectSeperator', false);
		
		if(replaceCR){
			var strCRPrefix = tl.getInput('strCRPrefix', true);
		}
		if(!strVariablePrefix){
			strVariablePrefix = "";
		}
		if(!objectSeperator){
			objectSeperator = ".";
		}

		var obj = JSON.parse(fs.readFileSync(jsonFilePath,'utf8'));
		exportJSONValues(obj, strVariablePrefix,"", replaceCR, strCRPrefix, objectSplit, objectSeperator).then(function(result) {
			tl.setResult(tl.TaskResult.Succeeded, "Wrapping successfull.");
		}).catch(function(err) {
			tl.setResult(tl.TaskResult.Failed, err);
			throw new Error(err);
		});	
	} catch (err) {
		tl.setResult(tl.TaskResult.Failed, err);
	}
}
run()