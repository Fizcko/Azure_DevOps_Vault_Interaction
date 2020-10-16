import tl = require('azure-pipelines-task-lib/task');
import path = require('path');
import fs = require('fs');

async function run() {
	
	try {
		
		var targetDirectory = tl.getInput('targetDirectory', true);
		var targetName = tl.getInput('targetName', true);
		var fileContent = tl.getInput('fileContent', true);
		var fileEncoding = tl.getInput('fileEncoding', true);
		var actionType = tl.getInput('actionType', true);
		if(actionType == "replaceToken"){
			var actionToken = tl.getInput('actionToken', true);
			var actionNewLineType = tl.getInput('actionNewLineType', true);
		}
		
		// Define output path
		var outputFilePath = path.join(targetDirectory,targetName);

		// Create ouptuf folder is needed
		if(!fs.existsSync(targetDirectory)){
			
			try{
				fs.mkdirSync(targetDirectory,{ recursive: true });
			} catch (err) {
				throw new Error("Mkdir error. " + err);
			}
		}

		var finalContent = null;
		var actionToPerform = null;

		// Perform actions
		switch(actionType){
			case "replaceToken":
				// Create regex
				var newLine = null;
				var newLineType = null;
				switch(actionNewLineType){
					case "cr":
						newLine = "\r";
						newLineType = "Carriage Return (CR, \\r)";
						break;
					case "lf":
						newLine = "\n";
						newLineType = "Line Feed (LF, \\n)";
						break;
					default:
						newLine = "\r\n";
						newLineType = "CR followed by LF (CRLF, \\r\\n)";
						break;
				}
				finalContent = fileContent.replace(new RegExp(actionToken,"g"),newLine);
				actionToPerform = "Replace token";
				break;
			case "decodeBase64":
				finalContent = new Buffer(fileContent, 'base64');
				actionToPerform = "Decode from base64";
				break;
			default:
				finalContent = fileContent;
				actionToPerform = "None";
		}

		// Create file
		try{
			fs.writeFileSync(outputFilePath,finalContent,fileEncoding);
		} catch (err) {
			throw new Error("Write error. " + err);
		}
		
		// Display results
		console.log("[INFO] The file saved in : '" + outputFilePath + "'");
		console.log("[INFO] Encoding : '" + fileEncoding + "'");
		console.log("[INFO] Action to perform : '" + actionToPerform + "'");
		if(actionType == "replaceToken"){
			console.log("[INFO] Token to replace : '" + actionToken + "'");
			console.log("[INFO] New line type : '" + newLineType + "'");
		}
		
		tl.setResult(tl.TaskResult.Succeeded, "Wrapping successfull.");

	} catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
	}
	
	
}

run();