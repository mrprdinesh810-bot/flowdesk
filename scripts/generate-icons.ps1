Add-Type -AssemblyName System.Drawing

function Draw-FlowDeskImage([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $radius = [int]($size * 0.25)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    
    # Create rounded rectangle path
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $arc = New-Object System.Drawing.Rectangle(0, 0, $diameter, $diameter)
    
    $path.AddArc($arc, 180, 90)
    $arc.X = $size - $diameter
    $path.AddArc($arc, 270, 90)
    $arc.Y = $size - $diameter
    $path.AddArc($arc, 0, 90)
    $arc.X = 0
    $path.AddArc($arc, 90, 90)
    $path.CloseFigure()

    # Fill Indigo background (#4F46E5 -> 79, 70, 229)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 79, 70, 229))
    $g.FillPath($brush, $path)

    # Draw checkmark path
    # Original SVG: (128, 268) -> (224, 364) -> (384, 164) on 512x512
    $scale = $size / 512.0
    $penWidth = [Math]::Max(2.0, 46.0 * $scale)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penWidth)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $p1 = New-Object System.Drawing.PointF((135.0 * $scale), (268.0 * $scale))
    $p2 = New-Object System.Drawing.PointF((224.0 * $scale), (360.0 * $scale))
    $p3 = New-Object System.Drawing.PointF((378.0 * $scale), (168.0 * $scale))

    $g.DrawLines($pen, [System.Drawing.PointF[]]@($p1, $p2, $p3))

    $g.Dispose()
    $brush.Dispose()
    $pen.Dispose()
    $path.Dispose()

    return $bmp
}

$outputDir = "h:\taskmanagerapp\apps\web\public"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Generate 512x512 PNG
$img512 = Draw-FlowDeskImage 512
$img512.Save("$outputDir\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Generate 192x192 PNG
$img192 = Draw-FlowDeskImage 192
$img192.Save("$outputDir\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Generate ICO for Windows Desktop
# An ICO file header: 6 bytes. Directory entry: 16 bytes.
$icoSizes = @(256, 48, 32, 16)
$icoBmps = @()
$pngBytesList = @()

foreach ($s in $icoSizes) {
    $bmp = Draw-FlowDeskImage $s
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList += ,$ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()
}

$icoFile = "h:\taskmanagerapp\app.ico"
$fs = [System.IO.File]::Create($icoFile)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type 1 = ICO
$bw.Write([uint16]$icoSizes.Count) # Count

$offset = 6 + (16 * $icoSizes.Count)

for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $s = $icoSizes[$i]
    $bytes = $pngBytesList[$i]
    
    $bw.Write([byte]$(if ($s -eq 256) { 0 } else { $s })) # Width
    $bw.Write([byte]$(if ($s -eq 256) { 0 } else { $s })) # Height
    $bw.Write([byte]0) # Color count
    $bw.Write([byte]0) # Reserved
    $bw.Write([uint16]1) # Color planes
    $bw.Write([uint16]32) # Bits per pixel
    $bw.Write([uint32]$bytes.Length) # Image size in bytes
    $bw.Write([uint32]$offset) # Offset
    $offset += $bytes.Length
}

for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $bw.Write($pngBytesList[$i])
}

$bw.Close()
$fs.Close()

# Also copy app.ico to apps/web/public/favicon.ico
Copy-Item $icoFile -Destination "$outputDir\favicon.ico" -Force

$img512.Dispose()
$img192.Dispose()

Write-Output "Successfully generated icon-512.png, icon-192.png, app.ico, and favicon.ico"
