# Global Paths
$rootPath = Get-Location
$pathVssConfigFile = Join-Path -Path $rootPath -ChildPath "vss-extension.json"
$commonFolderName = "common"
$pathCommon = Join-Path -Path $rootPath -ChildPath "dist\$commonFolderName"

# Read VSS file
try{
    $jsonVssConfigFile = Get-Content $pathVssConfigFile | Out-String | ConvertFrom-Json
}
catch{
    Write-Error "[ERROR] Error in the JSON file"
    Write-Error "[ERROR] $($_.Exception.Message)"
    exit
}

# Get current version
$vssVer = $jsonVssConfigFile.version
[int]$vssMajorVer, [int]$vssMinorVer, [int]$vssPatchVer = $vssVer.split('.')
# Update Patch version for local build
$vssPatchVer++
$jsonVssConfigFile.version = "$vssMajorVer.$vssMinorVer.$vssPatchVer"

Write-Output "[INFO] New version : '$vssMajorVer.$vssMinorVer.$vssPatchVer'"
# Save new version
try{
    $jsonResult = $jsonVssConfigFile | ConvertTo-Json -Depth 20
    Set-Content -Path $pathVssConfigFile -Value $jsonResult
}
catch{
    Write-Error "Error when saving file '$pathVssConfigFile'."
    exit
}

# Get sub projects
$subProjects = $jsonVssConfigFile.contributions
Foreach ($subProject in $subProjects){
    $currentProjectName = $subProject.properties.name
    $subProjectPath = Join-Path -Path $rootPath -ChildPath $subProject.properties.name
    $subCommunFolderPath = Join-Path -Path $subProjectPath -ChildPath $commonFolderName
    $pathTaskConfigFile = Join-Path -Path $subProjectPath -ChildPath "task.json"
    $packageLockFile = Join-Path -Path $subProjectPath -ChildPath "package-lock.json"
    $NodeModulesFolder = Join-Path -Path $subProjectPath -ChildPath "node_modules"

    # Load task file
    try{
        $jsonTaskConfigFile = Get-Content $pathTaskConfigFile | Out-String | ConvertFrom-Json
    }
    catch{
        Write-Error "[ERROR] Error in the JSON file"
        Write-Error "[ERROR] $($_.Exception.Message)"
        exit
    }

    # Update version
    $jsonTaskConfigFile.version.Major = $vssMajorVer
    $jsonTaskConfigFile.version.Minor = $vssMinorVer
    $jsonTaskConfigFile.version.Patch = $vssPatchVer

    # Save file
    try{
        $jsonResult = $jsonTaskConfigFile | ConvertTo-Json -Depth 20
        Set-Content -Path $pathTaskConfigFile -Value $jsonResult
	}
	catch{
		Write-Error "Error when saving file '$pathTaskConfigFile'."
		exit
	}
	
    try{
        Set-Location $subProjectPath
        # remove package-lock.json file
        if(Test-Path $packageLockFile){
            Remove-Item -Path "$packageLockFile" -Recurse -Force
        }
        # remove node_modules folder
        if(Test-Path $NodeModulesFolder){
            Remove-Item -Path "$NodeModulesFolder" -Recurse -Force
        }
        npm install --production --loglevel=error
        # remove package-lock.json file
        if(Test-Path $packageLockFile){
            Remove-Item -Path "$packageLockFile" -Recurse -Force
        }
    }
    catch{
        Write-Error "[ERROR] Error when install sub projects modules"
        Write-Error "[ERROR] $($_.Exception.Message)"
        exit
    }

    # Copy common functions
    $excludeFolders = ("dist/tool_create_file")
    if($currentProjectName -NotIn $excludeFolders){
        if(Test-Path $subCommunFolderPath){
            Remove-Item -Path "$subCommunFolderPath" -Recurse | Out-Null
        }
        Copy-Item -Path "$pathCommon" -Destination "$subProjectPath" -Recurse -Force
    }
}

# Delete common folder
Remove-Item -Path "$pathCommon" -Recurse -Force

# Start build
Set-Location $rootPath
tfx extension create --manifest-globs vss-extension.json