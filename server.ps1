# Askrindo SATU - Lightweight PowerShell Local HTTP Server
$port = 8080
$folder = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "     ASKRINDO SATU - SISTEM APLIKASI TERPADU" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "Server lokal aktif di: http://localhost:$port/" -ForegroundColor Green
    Write-Host "Tekan CTRL + C di jendela ini untuk menghentikan server.`n" -ForegroundColor Gray

    # Otomatis buka peramban default jika interaktif
    if ([Environment]::UserInteractive) {
        try { Start-Process "http://localhost:$port/" -ErrorAction SilentlyContinue } catch {}
    }

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }

        $localFilePath = Join-Path $folder $path

        if (Test-Path $localFilePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            
            # Deteksi Content-Type
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                Default { $response.ContentType = "application/octet-stream" }
            }

            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - Berkas Tidak Ditemukan di Askrindo SATU")
            $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
