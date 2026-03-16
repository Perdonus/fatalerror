using System.Runtime.InteropServices;
using Microsoft.Win32;
using DrawingBitmap = System.Drawing.Bitmap;
using DrawingSize = System.Drawing.Size;
using UiColor = Windows.UI.Color;

namespace NeuralV.Windows.Services;

public sealed class ThemePalette
{
    public UiColor Background { get; init; }
    public UiColor Surface { get; init; }
    public UiColor SurfaceRaised { get; init; }
    public UiColor Accent { get; init; }
    public UiColor AccentSoft { get; init; }
    public UiColor Outline { get; init; }
    public UiColor Text { get; init; }
    public UiColor MutedText { get; init; }
    public UiColor Success { get; init; }
    public UiColor Warning { get; init; }
    public UiColor Danger { get; init; }
    public bool IsDark { get; init; }

    public static ThemePalette DefaultDark() => FromAccent(UiColor.FromArgb(255, 110, 125, 255), true);

    public static ThemePalette FromAccent(UiColor accent, bool isDark)
    {
        var background = isDark ? UiColor.FromArgb(255, 14, 18, 27) : UiColor.FromArgb(255, 244, 246, 255);
        var surface = Blend(background, accent, isDark ? 0.12 : 0.10);
        var raised = Blend(background, accent, isDark ? 0.18 : 0.16);
        return new ThemePalette
        {
            Background = background,
            Surface = surface,
            SurfaceRaised = raised,
            Accent = accent,
            AccentSoft = Blend(surface, accent, isDark ? 0.42 : 0.26),
            Outline = Blend(surface, isDark ? UiColor.FromArgb(255, 157, 167, 198) : UiColor.FromArgb(255, 86, 96, 122), isDark ? 0.24 : 0.32),
            Text = isDark ? UiColor.FromArgb(255, 245, 247, 255) : UiColor.FromArgb(255, 18, 22, 31),
            MutedText = isDark ? UiColor.FromArgb(255, 188, 196, 222) : UiColor.FromArgb(255, 92, 101, 126),
            Success = UiColor.FromArgb(255, 92, 193, 138),
            Warning = UiColor.FromArgb(255, 255, 184, 97),
            Danger = UiColor.FromArgb(255, 255, 126, 150),
            IsDark = isDark
        };
    }

    public static UiColor Blend(UiColor from, UiColor to, double ratio)
    {
        var clamped = Math.Max(0, Math.Min(1, ratio));
        byte Mix(byte a, byte b) => (byte)(a + (b - a) * clamped);
        return UiColor.FromArgb(255, Mix(from.R, to.R), Mix(from.G, to.G), Mix(from.B, to.B));
    }
}

public static class WallpaperPaletteService
{
    private const uint SpiGetDeskWallpaper = 0x0073;

    public static ThemePalette Load()
    {
        var isDark = DetectDarkMode();
        var wallpaperAccent = TryReadWallpaperAccent();
        if (wallpaperAccent.HasValue)
        {
            return ThemePalette.FromAccent(wallpaperAccent.Value, isDark);
        }

        return ThemePalette.FromAccent(ReadAccentColor(), isDark);
    }

    private static bool DetectDarkMode()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");
            return key?.GetValue("AppsUseLightTheme") is int value && value == 0;
        }
        catch
        {
            return true;
        }
    }

    private static UiColor ReadAccentColor()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\DWM");
            var raw = key?.GetValue("ColorizationColor");
            if (raw is int value)
            {
                var a = (byte)((value >> 24) & 0xFF);
                var r = (byte)((value >> 16) & 0xFF);
                var g = (byte)((value >> 8) & 0xFF);
                var b = (byte)(value & 0xFF);
                if (a > 0)
                {
                    return UiColor.FromArgb(255, r, g, b);
                }
            }
        }
        catch
        {
        }

        return UiColor.FromArgb(255, 110, 125, 255);
    }

    private static UiColor? TryReadWallpaperAccent()
    {
        var path = GetWallpaperPath();
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return null;
        }

        try
        {
            using var bitmap = new DrawingBitmap(path);
            using var sample = new DrawingBitmap(bitmap, new DrawingSize(Math.Min(96, bitmap.Width), Math.Min(96, bitmap.Height)));
            long sumR = 0;
            long sumG = 0;
            long sumB = 0;
            long count = 0;

            var stepX = Math.Max(1, sample.Width / 24);
            var stepY = Math.Max(1, sample.Height / 24);
            for (var y = 0; y < sample.Height; y += stepY)
            {
                for (var x = 0; x < sample.Width; x += stepX)
                {
                    var pixel = sample.GetPixel(x, y);
                    var brightness = pixel.R + pixel.G + pixel.B;
                    if (brightness < 36 || brightness > 735)
                    {
                        continue;
                    }

                    sumR += pixel.R;
                    sumG += pixel.G;
                    sumB += pixel.B;
                    count++;
                }
            }

            if (count == 0)
            {
                return null;
            }

            return UiColor.FromArgb(255, (byte)(sumR / count), (byte)(sumG / count), (byte)(sumB / count));
        }
        catch
        {
            return null;
        }
    }

    private static string GetWallpaperPath()
    {
        var buffer = new char[260];
        return SystemParametersInfoW(SpiGetDeskWallpaper, (uint)buffer.Length, buffer, 0)
            ? new string(buffer).TrimEnd('\0')
            : string.Empty;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool SystemParametersInfoW(uint uiAction, uint uiParam, [Out] char[] pvParam, uint fWinIni);
}
