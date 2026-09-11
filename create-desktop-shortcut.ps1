$wshShell = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$shortcutPath = Join-Path $desktopPath "FlowDesk.lnk"

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsPath = Join-Path $rootPath "FlowDesk.vbs"
$iconPath = Join-Path $rootPath "app.ico"

$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $rootPath
$shortcut.WindowStyle = 7 # Minimized
$shortcut.Description = "FlowDesk - Personal Execution System"

if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath, 0"
}

$shortcut.Save()

Write-Output "FlowDesk shortcut created successfully on Desktop: $shortcutPath"
