Option Explicit
Dim WshShell, fso, appDir, strEdge, strChrome, httpCheck, isRunning

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = appDir

isRunning = False
On Error Resume Next
Set httpCheck = CreateObject("MSXML2.ServerXMLHTTP.6.0")
httpCheck.Open "GET", "http://localhost:5173", False
httpCheck.setTimeouts 500, 500, 500, 500
httpCheck.Send
If Err.Number = 0 Then
    isRunning = True
End If
On Error GoTo 0

If Not isRunning Then
    WshShell.Run "cmd /c npm.cmd run dev", 0, False
    WScript.Sleep 1800
End If

strChrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
strEdge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

If fso.FileExists(strChrome) Then
    WshShell.Run Chr(34) & strChrome & Chr(34) & " --app=http://localhost:5173", 1, False
ElseIf fso.FileExists(strEdge) Then
    WshShell.Run Chr(34) & strEdge & Chr(34) & " --app=http://localhost:5173", 1, False
Else
    WshShell.Run "http://localhost:5173", 1, False
End If