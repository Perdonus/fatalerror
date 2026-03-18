using System.Drawing;
using System.Drawing.Drawing2D;
using NeuralV.Windows.Models;

namespace NeuralV.Windows.Services;

public static class WindowsTrayIconRenderer
{
    public static Icon Create(TrayProgressState state)
    {
        using var bitmap = new Bitmap(64, 64, System.Drawing.Imaging.PixelFormat.Format32bppArgb);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.SmoothingMode = SmoothingMode.AntiAlias;
        graphics.Clear(System.Drawing.Color.Transparent);

        var ringBounds = new RectangleF(6, 6, 52, 52);
        using var ringBackground = new Pen(System.Drawing.Color.FromArgb(68, 255, 255, 255), 7f)
        {
            StartCap = LineCap.Round,
            EndCap = LineCap.Round
        };
        using var ringProgress = new Pen(ResolveAccent(state.VisualState), 7f)
        {
            StartCap = LineCap.Round,
            EndCap = LineCap.Round
        };
        using var centerBrush = new SolidBrush(System.Drawing.Color.FromArgb(230, 20, 23, 32));
        using var centerAccent = new SolidBrush(ResolveCenterFill(state.VisualState));
        using var glyphBrush = new SolidBrush(System.Drawing.Color.White);
        using var glyphFont = new Font("Segoe UI", 18f, FontStyle.Bold, GraphicsUnit.Pixel);
        using var percentFont = new Font("Segoe UI", 14f, FontStyle.Bold, GraphicsUnit.Pixel);
        using var centerFormat = new StringFormat
        {
            Alignment = StringAlignment.Center,
            LineAlignment = StringAlignment.Center
        };

        graphics.FillEllipse(centerBrush, 11, 11, 42, 42);
        graphics.DrawArc(ringBackground, ringBounds, -90f, 360f);

        if (state.IsIndeterminate)
        {
            graphics.DrawArc(ringProgress, ringBounds, -90f, 108f);
        }
        else if (state.ProgressPercent > 0)
        {
            var sweep = Math.Max(18f, 360f * Math.Clamp(state.ProgressPercent, 0, 100) / 100f);
            graphics.DrawArc(ringProgress, ringBounds, -90f, sweep);
        }

        graphics.FillEllipse(centerAccent, 18, 18, 28, 28);

        var glyph = ResolveGlyph(state);
        if (!string.IsNullOrEmpty(glyph))
        {
            graphics.DrawString(glyph, glyphFont, glyphBrush, new RectangleF(18, 15, 28, 30), centerFormat);
        }
        else if (state.ProgressPercent > 0)
        {
            graphics.DrawString(
                Math.Clamp(state.ProgressPercent, 0, 99).ToString("00"),
                percentFont,
                glyphBrush,
                new RectangleF(16, 19, 32, 22),
                centerFormat);
        }
        else
        {
            graphics.DrawString("N", glyphFont, glyphBrush, new RectangleF(18, 15, 28, 30), centerFormat);
        }

        var rawHandle = bitmap.GetHicon();
        try
        {
            using var source = Icon.FromHandle(rawHandle);
            return (Icon)source.Clone();
        }
        finally
        {
            DestroyIcon(rawHandle);
        }
    }

    private static string ResolveGlyph(TrayProgressState state) => state.VisualState switch
    {
        TrayScanVisualState.Completed => "✓",
        TrayScanVisualState.Failed => "!",
        TrayScanVisualState.Cancelled => "×",
        TrayScanVisualState.AwaitingUpload => "↑",
        _ => string.Empty
    };

    private static System.Drawing.Color ResolveAccent(TrayScanVisualState state) => state switch
    {
        TrayScanVisualState.Preparing => System.Drawing.Color.FromArgb(255, 247, 192, 69),
        TrayScanVisualState.Running => System.Drawing.Color.FromArgb(255, 88, 140, 255),
        TrayScanVisualState.AwaitingUpload => System.Drawing.Color.FromArgb(255, 183, 109, 255),
        TrayScanVisualState.Completed => System.Drawing.Color.FromArgb(255, 93, 201, 125),
        TrayScanVisualState.Failed => System.Drawing.Color.FromArgb(255, 255, 116, 110),
        TrayScanVisualState.Cancelled => System.Drawing.Color.FromArgb(255, 166, 172, 194),
        _ => System.Drawing.Color.FromArgb(255, 132, 145, 255)
    };

    private static System.Drawing.Color ResolveCenterFill(TrayScanVisualState state) => state switch
    {
        TrayScanVisualState.Completed => System.Drawing.Color.FromArgb(255, 74, 163, 101),
        TrayScanVisualState.Failed => System.Drawing.Color.FromArgb(255, 184, 72, 72),
        TrayScanVisualState.Cancelled => System.Drawing.Color.FromArgb(255, 95, 102, 122),
        TrayScanVisualState.AwaitingUpload => System.Drawing.Color.FromArgb(255, 113, 80, 171),
        TrayScanVisualState.Running => System.Drawing.Color.FromArgb(255, 58, 94, 170),
        TrayScanVisualState.Preparing => System.Drawing.Color.FromArgb(255, 156, 120, 34),
        _ => System.Drawing.Color.FromArgb(255, 59, 72, 109)
    };

    [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true)]
    private static extern bool DestroyIcon(IntPtr handle);
}
