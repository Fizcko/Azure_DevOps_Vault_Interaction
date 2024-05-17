import tl = require('azure-pipelines-task-lib/task');

export function exportJSONValues(obj: any, prefix: string, replaceCR: boolean, strCRPrefix: string, writeAsSecret : boolean): Promise<boolean> {

    // Source https://raw.githubusercontent.com/geeklearningio/gl-vsts-tasks-variables/master/Common/Node/expandJObject.ts
    return new Promise(async (resolve, reject) => {
        
        try{

            var typeArray: string[] =["string", "number", "boolean"];

            if (obj instanceof Array) {
                if(prefix != ""){
                    prefix = prefix + "_";
                }
                else{
                    prefix = "";
                }
                for (var i = 0; i < obj.length; i++) {
                    var element = obj[i];
                    await exportJSONValues(element, prefix + i.toString(), replaceCR, strCRPrefix, writeAsSecret);
                }
            }
            else if (typeArray.indexOf(typeof obj) > -1){
                var objValue = typeArray.indexOf(typeof obj)>0 ? obj.toString() : obj;
                if(replaceCR){
                    objValue = objValue.replace(/(?:\r\n|[\r\n])/g,strCRPrefix);
                }
                tl.setVariable(prefix, objValue, writeAsSecret);
                console.log("[INFO] Injecting variable : " + prefix);
            }
            else{
                if(prefix != ""){
                    prefix = prefix + "_";
                }
                else{
                    prefix = "";
                }
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        var element = obj[key];
                        await exportJSONValues(element, prefix + key, replaceCR, strCRPrefix, writeAsSecret);
                    }
                }
            }

            resolve(true);

        } catch (err) {
		    reject("Error when exporting values. " + err);
	    }

    });
}