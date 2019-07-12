import tl = require('azure-pipelines-task-lib/task');

export function exportJSONValues(obj: any, prefix: string): Promise<boolean> {

    // Source https://raw.githubusercontent.com/geeklearningio/gl-vsts-tasks-variables/master/Common/Node/expandJObject.ts
    return new Promise(async (resolve, reject) => {
        
        try{

            var typeArray: string[] =["string", "number", "boolean"];

            if (obj instanceof Array) {
                for (var i = 0; i < obj.length; i++) {
                    var element = obj[i];
                    await exportJSONValues(element, prefix + "_" + i.toString());
                }
            }
            else if (typeArray.indexOf(typeof obj) > -1){
                var objValue = typeArray.indexOf(typeof obj)>0 ? obj.toString() : obj;
                var objDisplayValue = objValue.replace(/./g, "*");
                console.log("[INFO] Injecting variable : " + prefix + ", value : " + objDisplayValue);
                tl.setVariable(prefix, objValue, true);
            }
            else{
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        var element = obj[key];
                        await exportJSONValues(element, prefix + "_" + key);
                    }
                }
            }

            resolve(true);

        } catch (err) {
		    reject("Error when exporting values. " + err);
	    }

    });
}