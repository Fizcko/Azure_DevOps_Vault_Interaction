# Global Paths
$pathTaskConfigFile = "./dist/kv_read/task.json"
$pathVssConfigFile = "./vss-extension.json"

try{
	$jsonTaskConfigFile = Get-Content $pathTaskConfigFile | Out-String | ConvertFrom-Json
}
catch{
	Write-Error "[ERROR] Error in the JSON file"
	Write-Error "[ERROR] $($_.Exception.Message)"
	exit
}
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
# Update Patch version for TFS build or Local build
$vssPatchVer++

# Update version
$jsonTaskConfigFile.version.Major = $vssMajorVer
$jsonTaskConfigFile.version.Minor = $vssMinorVer
$jsonTaskConfigFile.version.Patch = $vssPatchVer

# Save changes
try{
	$jsonResult = $jsonTaskConfigFile | ConvertTo-Json -Depth 20
}
catch{
	Write-Error "Error when converting the file in JSON format."
	exit
}
Set-Content -Path $pathTaskConfigFile -Value $jsonResult

try{
	$jsonResult = $jsonVssConfigFile | ConvertTo-Json -Depth 20
}
catch{
	Write-Error "Error when converting the file in JSON format."
	exit
}
Set-Content -Path $pathVssConfigFile -Value $jsonResult
# Start build
tfx extension create --manifest-globs vss-extension.json --rev-version