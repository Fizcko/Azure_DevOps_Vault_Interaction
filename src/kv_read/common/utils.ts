import tl = require('azure-pipelines-task-lib/task');

// export function exportJSONValues(obj: any, prefix: string, replaceCR: boolean, strCRPrefix: string): Promise<boolean> {
export function exportJSONValues(obj: any, prefix: string, keyName: string, replaceCR: boolean, strCRPrefix: string, objectSplit: boolean, objectSeperator: string): Promise<boolean> {

    // Source https://raw.githubusercontent.com/geeklearningio/gl-vsts-tasks-variables/master/Common/Node/expandJObject.ts
    return new Promise(async (resolve, reject) => {
        
        try{

            var typeArray: string[] =["string", "number", "boolean"];

            if (obj instanceof Array && objectSplit) {
                for (var i = 0; i < obj.length; i++) {
                    var element = obj[i];
                    if (keyName == null || keyName == ""){
                        await exportJSONValues(element, prefix,i.toString(), replaceCR, strCRPrefix, objectSplit, objectSeperator);
                    } else {
                        await exportJSONValues(element, prefix,[keyName,i.toString()].join(objectSeperator), replaceCR, strCRPrefix, objectSplit, objectSeperator);
                    }
                }
            }
            //If object split is false, treat array as a full object to support full array subsitution
            else if (obj instanceof Array && !objectSplit) {
                // add prefix to keyName on start if prefix is not null
                if(prefix != ""){
                    keyName = prefix + "_" + keyName;
                }
                var jsonObjectValue = JSON.stringify(obj);
                if(replaceCR){
                    objValue = jsonObjectValue.replace(/(?:\r\n|[\r\n])/g,strCRPrefix);
                }
                tl.setVariable(keyName, jsonObjectValue, true);
                console.log("[INFO] Injecting variable : " + keyName + ", value : " + jsonObjectValue);
            }
            else if (typeArray.indexOf(typeof obj) > -1){
                // add prefix to keyName on start if prefix is not null
                if(prefix != ""){
                    keyName = prefix + "_" + keyName;
                }
                var objValue = typeArray.indexOf(typeof obj)>0 ? obj.toString() : obj;
                if(replaceCR){
                    objValue = objValue.replace(/(?:\r\n|[\r\n])/g,strCRPrefix);
                }
                tl.setVariable(keyName, objValue, true);
                console.log("[INFO] Injecting variable : " + keyName + ", value : " + objValue);
            }
            else{
                if ((keyName != null && keyName != "") && !objectSplit ){
                    // add prefix to keyName on start if prefix is not null
                    if(prefix != ""){
                        keyName = prefix + "_" + keyName;
                    }
                    var jsonObjectValue = JSON.stringify(obj);
                    if(replaceCR){
                        objValue = jsonObjectValue.replace(/(?:\r\n|[\r\n])/g,strCRPrefix);
                    }
                    tl.setVariable(keyName, jsonObjectValue, true);
                    console.log("[INFO] Injecting variable : " + keyName + ", value : " + jsonObjectValue);

                }
                else {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            var element = obj[key];
                            if (keyName == null || keyName == ""){
                                await exportJSONValues(element, prefix,key, replaceCR, strCRPrefix, objectSplit, objectSeperator);
                            } else {
                                await exportJSONValues(element, prefix,[keyName,key].join(objectSeperator), replaceCR, strCRPrefix, objectSplit, objectSeperator);
                            }
                        }
                    }
                }
            }

            resolve(true);

        } catch (err) {
		    reject("Error when exporting values. " + err);
	    }

    });
}