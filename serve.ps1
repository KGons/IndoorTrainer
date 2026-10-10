# serve.ps1 - Zero-dependency local web server for Indoor Trainer App
$port = 8080
$path = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Failed to start listener on port $port. It might already be in use." -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚴 Indoor Trainer FTMS Mobile App Server Running!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "👉 Open on PC Browser:" -ForegroundColor Yellow
Write-Host "   http://localhost:$port" -ForegroundColor White
Write-Host ""
Write-Host "👉 To Run Standalone on Android (No PC needed during workouts!):" -ForegroundColor Yellow
Write-Host "   1. Push this folder to a free GitHub repository." -ForegroundColor Gray
Write-Host "   2. Enable GitHub Pages in Repo Settings -> Pages." -ForegroundColor Gray
Write-Host "   3. Open the HTTPS link in Chrome on your Android phone." -ForegroundColor Gray
Write-Host "   4. Tap '📲 Install' or Chrome Menu -> 'Install app'." -ForegroundColor Gray
Write-Host "   Once installed, you can turn off your PC completely!" -ForegroundColor Green
Write-Host ""
Write-Host "👉 Or For Quick USB Testing on Android:" -ForegroundColor Yellow
Write-Host "   Connect USB -> PC Chrome 'chrome://inspect/#devices' -> Port forward $port -> localhost:$port" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan

$mimeTypes = @{
    ".html"        = "text/html; charset=utf-8"
    ".css"         = "text/css; charset=utf-8"
    ".js"          = "application/javascript; charset=utf-8"
    ".json"        = "application/json"
    ".webmanifest" = "application/manifest+json"
    ".png"         = "image/png"
    ".svg"         = "image/svg+xml"
    ".csv"         = "text/csv; charset=utf-8"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/" -or [string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "/index.html"
        }

        $localFilePath = Join-Path $path ($urlPath.TrimStart("/").Replace("/", "\"))

        if (Test-Path $localFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            
            $response.ContentType = $contentType
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
