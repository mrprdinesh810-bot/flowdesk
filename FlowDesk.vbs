Set WshShell = CreateObject("WScript.Shell")
strPath = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
WshShell.Run Chr(34) & strPath & "FlowDesk.bat" & Chr(34), 0, False
