Add-Type -AssemblyName System.Drawing

function Generate-FlowDeskIcon([string]$destDir, [int]$fullSize, [int]$fgSize) {
    if (!(Test-Path $destDir)) { 
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null 
    }

    # 1. Full Launcher Icon (square with rounded corners)
    $bmp = New-Object System.Drawing.Bitmap($fullSize, $fullSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $radius = [int]($fullSize * 0.25)
    $diameter = $radius * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $arc = New-Object System.Drawing.Rectangle(0, 0, $diameter, $diameter)
    $path.AddArc($arc, 180, 90)
    $arc.X = $fullSize - $diameter
    $path.AddArc($arc, 270, 90)
    $arc.Y = $fullSize - $diameter
    $path.AddArc($arc, 0, 90)
    $arc.X = 0
    $path.AddArc($arc, 90, 90)
    $path.CloseFigure()

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 79, 70, 229)) # #4F46E5
    $g.FillPath($brush, $path)

    $scale = $fullSize / 512.0
    $penWidth = [Math]::Max(2.0, 46.0 * $scale)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penWidth)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $p1 = New-Object System.Drawing.PointF((135.0 * $scale), (268.0 * $scale))
    $p2 = New-Object System.Drawing.PointF((224.0 * $scale), (360.0 * $scale))
    $p3 = New-Object System.Drawing.PointF((378.0 * $scale), (168.0 * $scale))
    $g.DrawLines($pen, [System.Drawing.PointF[]]@($p1, $p2, $p3))
    $bmp.Save((Join-Path $destDir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $brush.Dispose(); $pen.Dispose(); $path.Dispose(); $bmp.Dispose()

    # 2. Round Launcher Icon (circle)
    $bmpRound = New-Object System.Drawing.Bitmap($fullSize, $fullSize)
    $g2 = [System.Drawing.Graphics]::FromImage($bmpRound)
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g2.Clear([System.Drawing.Color]::Transparent)
    $brushRound = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 79, 70, 229))
    $g2.FillEllipse($brushRound, 0, 0, $fullSize, $fullSize)

    $penRound = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penWidth)
    $penRound.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penRound.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penRound.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g2.DrawLines($penRound, [System.Drawing.PointF[]]@($p1, $p2, $p3))
    $bmpRound.Save((Join-Path $destDir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g2.Dispose(); $brushRound.Dispose(); $penRound.Dispose(); $bmpRound.Dispose()

    # 3. Adaptive Foreground Icon (scaled checkmark centered in fgSize, e.g. 108dp)
    $bmpFg = New-Object System.Drawing.Bitmap($fgSize, $fgSize)
    $g3 = [System.Drawing.Graphics]::FromImage($bmpFg)
    $g3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g3.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g3.Clear([System.Drawing.Color]::Transparent)

    $fgScale = ($fgSize * 0.60) / 512.0
    $fgOffset = ($fgSize * 0.20)
    $fgPenWidth = [Math]::Max(2.0, 48.0 * $fgScale)
    $penFg = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $fgPenWidth)
    $penFg.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penFg.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penFg.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $fp1 = New-Object System.Drawing.PointF((135.0 * $fgScale + $fgOffset), (268.0 * $fgScale + $fgOffset))
    $fp2 = New-Object System.Drawing.PointF((224.0 * $fgScale + $fgOffset), (360.0 * $fgScale + $fgOffset))
    $fp3 = New-Object System.Drawing.PointF((378.0 * $fgScale + $fgOffset), (168.0 * $fgScale + $fgOffset))
    $g3.DrawLines($penFg, [System.Drawing.PointF[]]@($fp1, $fp2, $fp3))
    $bmpFg.Save((Join-Path $destDir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g3.Dispose(); $penFg.Dispose(); $bmpFg.Dispose()
    
    Write-Host "Generated icons in $destDir"
}

$resBase = "h:\taskmanagerapp\apps\web\android\app\src\main\res"
Generate-FlowDeskIcon -destDir "$resBase\mipmap-mdpi" -fullSize 48 -fgSize 108
Generate-FlowDeskIcon -destDir "$resBase\mipmap-hdpi" -fullSize 72 -fgSize 162
Generate-FlowDeskIcon -destDir "$resBase\mipmap-xhdpi" -fullSize 96 -fgSize 216
Generate-FlowDeskIcon -destDir "$resBase\mipmap-xxhdpi" -fullSize 144 -fgSize 324
Generate-FlowDeskIcon -destDir "$resBase\mipmap-xxxhdpi" -fullSize 192 -fgSize 432
Write-Host "All Android icons generated successfully!"
