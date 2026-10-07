Set sh = CreateObject("WScript.Shell")
Set sc = sh.CreateShortcut("C:\\Users\\Colibecas\\OneDrive\\Desktop\\Mis Apuntes.lnk")
sc.TargetPath = "wscript.exe"
sc.Arguments = """"C:\\Users\\Colibecas\\OneDrive\\Desktop\\apuntes-appBiniciar_app.vbs""""
sc.WorkingDirectory = "C:\\Users\\Colibecas\\OneDrive\\Desktop\\apuntes-app"
sc.IconLocation = "C:\\Users\\Colibecas\\OneDrive\\Desktop\\apuntes-app\\app_icon.ico,0"
sc.Description = "Mis Apuntes - Aplicación de Estudio"
sc.Save
