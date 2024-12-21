Get-ChildItem -Path . -Filter *.mp3 | ForEach-Object {
    $base64Content = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($_.FullName))
    $outputFileName = "$($_.BaseName)-base64.txt"
    $base64Content > $outputFileName
}