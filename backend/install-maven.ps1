$url = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
$zipFile = "E:\WEB\LeadGrowth\backend\maven.zip"
$targetFolder = "E:\WEB\LeadGrowth\backend\maven"

Write-Host "1. Creating directory structure..." -ForegroundColor Green
if (!(Test-Path $targetFolder)) {
    New-Item -ItemType Directory -Path $targetFolder | Out-Null
}

Write-Host "2. Downloading Apache Maven 3.9.6 from Archive mirror..." -ForegroundColor Green
# Use TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $zipFile

Write-Host "3. Extracting files to $targetFolder..." -ForegroundColor Green
Expand-Archive -Path $zipFile -DestinationPath $targetFolder -Force

Write-Host "4. Cleaning up temporary zip..." -ForegroundColor Green
Remove-Item $zipFile

$binPath = "E:\WEB\LeadGrowth\backend\maven\apache-maven-3.9.6\bin"

Write-Host "5. Setting USER Environment PATH permanently..." -ForegroundColor Green
$oldPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($oldPath -notlike "*$binPath*") {
    $newPath = $oldPath + ";" + $binPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "System PATH updated permanently for user." -ForegroundColor Cyan
} else {
    Write-Host "PATH already contains Maven." -ForegroundColor Yellow
}

Write-Host "6. Updating current terminal session PATH..." -ForegroundColor Green
$env:Path += ";$binPath"

Write-Host "`n🎉 Apache Maven 3.9.6 installed successfully!" -ForegroundColor Green
Write-Host "You can now run 'mvn -version' or 'mvn spring-boot:run' in this terminal session." -ForegroundColor Cyan
Write-Host "Note: If opening a new terminal, the PATH is already updated permanently!" -ForegroundColor Cyan
