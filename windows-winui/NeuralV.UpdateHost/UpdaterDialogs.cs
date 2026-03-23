using System.Drawing;
using System.Windows.Forms;
using NeuralV.Windows.Services;

namespace NeuralV.UpdateHost;

internal enum UpdateDialogCloseReason
{
    Exit,
    LaunchCurrent,
    LaunchUpdated
}

internal sealed class UpdatePromptDialog : Form
{
    public UpdatePromptDialog(string currentVersion, string newVersion)
    {
        AutoScaleMode = AutoScaleMode.Dpi;
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        ControlBox = false;
        ShowInTaskbar = true;
        Text = "NeuralV";
        Width = 540;
        Height = 320;
        BackColor = Color.FromArgb(246, 249, 246);
        Font = new Font("Segoe UI", 10f, FontStyle.Regular, GraphicsUnit.Point);

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(28),
            ColumnCount = 1,
            RowCount = 4,
            BackColor = BackColor
        };
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        var title = new Label
        {
            AutoSize = true,
            Text = "Доступно обновление NeuralV",
            Font = new Font("Segoe UI Semibold", 18f, FontStyle.Bold, GraphicsUnit.Point),
            ForeColor = Color.FromArgb(23, 34, 28),
            Margin = new Padding(0, 0, 0, 12)
        };

        var subtitle = new Label
        {
            AutoSize = true,
            MaximumSize = new Size(460, 0),
            Text = $"Найдена новая версия {newVersion}. Сейчас установлена {currentVersion}. Обновить клиент перед запуском?",
            Font = new Font("Segoe UI", 10.5f, FontStyle.Regular, GraphicsUnit.Point),
            ForeColor = Color.FromArgb(74, 89, 80),
            Margin = new Padding(0, 0, 0, 20)
        };

        var card = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = Color.White,
            Padding = new Padding(18),
            Margin = new Padding(0, 0, 0, 20)
        };

        var cardTitle = new Label
        {
            AutoSize = true,
            Text = "Что изменится",
            Font = new Font("Segoe UI Semibold", 11f, FontStyle.Bold, GraphicsUnit.Point),
            ForeColor = Color.FromArgb(23, 34, 28),
            Dock = DockStyle.Top
        };

        var cardBody = new Label
        {
            AutoSize = true,
            MaximumSize = new Size(420, 0),
            Text = "Updater скачает пакет, распакует его, применит обновление и заново откроет NeuralV. Текущую версию можно запустить и без обновления.",
            Font = new Font("Segoe UI", 10f, FontStyle.Regular, GraphicsUnit.Point),
            ForeColor = Color.FromArgb(82, 96, 89),
            Dock = DockStyle.Bottom,
            Margin = new Padding(0, 10, 0, 0)
        };

        card.Controls.Add(cardBody);
        card.Controls.Add(cardTitle);

        var buttons = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            AutoSize = true,
            WrapContents = false,
            Margin = new Padding(0)
        };

        var updateButton = CreatePrimaryButton("Обновить");
        updateButton.DialogResult = DialogResult.OK;
        var cancelButton = CreateSecondaryButton("Отмена");
        cancelButton.DialogResult = DialogResult.Cancel;

        buttons.Controls.Add(updateButton);
        buttons.Controls.Add(cancelButton);

        root.Controls.Add(title, 0, 0);
        root.Controls.Add(subtitle, 0, 1);
        root.Controls.Add(card, 0, 2);
        root.Controls.Add(buttons, 0, 3);

        AcceptButton = updateButton;
        CancelButton = cancelButton;
        Controls.Add(root);
    }

    private static Button CreatePrimaryButton(string text)
    {
        return new Button
        {
            AutoSize = true,
            Text = text,
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.FromArgb(33, 79, 58),
            ForeColor = Color.FromArgb(244, 255, 248),
            Padding = new Padding(16, 10, 16, 10),
            Margin = new Padding(12, 0, 0, 0)
        };
    }

    private static Button CreateSecondaryButton(string text)
    {
        return new Button
        {
            AutoSize = true,
            Text = text,
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.White,
            ForeColor = Color.FromArgb(33, 79, 58),
            Padding = new Padding(16, 10, 16, 10),
            Margin = new Padding(12, 0, 0, 0)
        };
    }
}

internal sealed class UpdateProgressDialog : Form
{
    private readonly Label _titleLabel;
    private readonly Label _detailLabel;
    private readonly ProgressBar _progressBar;
    private readonly Label _percentLabel;
    private readonly Button _primaryButton;
    private readonly Button _secondaryButton;
    private readonly Label[] _stepLabels;
    private bool _running = true;
    private bool _canCancel = true;

    public UpdateProgressDialog(string title)
    {
        AutoScaleMode = AutoScaleMode.Dpi;
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        ControlBox = false;
        ShowInTaskbar = true;
        Text = "NeuralV";
        Width = 600;
        Height = 390;
        BackColor = Color.FromArgb(246, 249, 246);
        Font = new Font("Segoe UI", 10f, FontStyle.Regular, GraphicsUnit.Point);

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(28),
            ColumnCount = 1,
            RowCount = 5,
            BackColor = BackColor
        };
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        _titleLabel = new Label
        {
            AutoSize = true,
            Text = title,
            Font = new Font("Segoe UI Semibold", 18f, FontStyle.Bold, GraphicsUnit.Point),
            ForeColor = Color.FromArgb(23, 34, 28),
            Margin = new Padding(0, 0, 0, 10)
        };

        _detailLabel = new Label
        {
            AutoSize = true,
            MaximumSize = new Size(500, 0),
            Text = "Подготавливаем обновление.",
            Font = new Font("Segoe UI", 10.5f, FontStyle.Regular, GraphicsUnit.Point),
            ForeColor = Color.FromArgb(74, 89, 80),
            Margin = new Padding(0, 0, 0, 18)
        };

        var progressPanel = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 1,
            Margin = new Padding(0, 0, 0, 22)
        };
        progressPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100f));
        progressPanel.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));

        _progressBar = new ProgressBar
        {
            Dock = DockStyle.Fill,
            Height = 14,
            Style = ProgressBarStyle.Marquee,
            Margin = new Padding(0, 4, 16, 0)
        };

        _percentLabel = new Label
        {
            AutoSize = true,
            Text = "0%",
            Font = new Font("Segoe UI Semibold", 11f, FontStyle.Bold, GraphicsUnit.Point),
            ForeColor = Color.FromArgb(33, 79, 58),
            Margin = new Padding(0, 0, 0, 0)
        };

        progressPanel.Controls.Add(_progressBar, 0, 0);
        progressPanel.Controls.Add(_percentLabel, 1, 0);

        var stepsCard = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = Color.White,
            Padding = new Padding(18),
            Margin = new Padding(0, 0, 0, 20)
        };

        var stepsRoot = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 5,
            BackColor = Color.White
        };
        _stepLabels = new[]
        {
            CreateStepLabel("Проверка"),
            CreateStepLabel("Скачивание"),
            CreateStepLabel("Распаковка"),
            CreateStepLabel("Установка"),
            CreateStepLabel("Запуск")
        };
        for (var index = 0; index < _stepLabels.Length; index++)
        {
            stepsRoot.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            stepsRoot.Controls.Add(_stepLabels[index], 0, index);
        }
        stepsCard.Controls.Add(stepsRoot);

        var buttons = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            AutoSize = true,
            WrapContents = false,
            Margin = new Padding(0)
        };

        _primaryButton = new Button
        {
            AutoSize = true,
            Text = "Запустить текущую версию",
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.FromArgb(33, 79, 58),
            ForeColor = Color.FromArgb(244, 255, 248),
            Padding = new Padding(16, 10, 16, 10),
            Margin = new Padding(12, 0, 0, 0),
            Visible = false
        };
        _primaryButton.Click += (_, _) =>
        {
            CloseReason = UpdateDialogCloseReason.LaunchCurrent;
            Close();
        };

        _secondaryButton = new Button
        {
            AutoSize = true,
            Text = "Отмена",
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.White,
            ForeColor = Color.FromArgb(33, 79, 58),
            Padding = new Padding(16, 10, 16, 10),
            Margin = new Padding(12, 0, 0, 0)
        };
        _secondaryButton.Click += (_, _) =>
        {
            if (_running && _canCancel)
            {
                CancelRequested?.Invoke(this, EventArgs.Empty);
                _secondaryButton.Enabled = false;
                _secondaryButton.Text = "Отменяем...";
                return;
            }

            CloseReason = UpdateDialogCloseReason.Exit;
            Close();
        };

        buttons.Controls.Add(_primaryButton);
        buttons.Controls.Add(_secondaryButton);

        root.Controls.Add(_titleLabel, 0, 0);
        root.Controls.Add(_detailLabel, 0, 1);
        root.Controls.Add(progressPanel, 0, 2);
        root.Controls.Add(stepsCard, 0, 3);
        root.Controls.Add(buttons, 0, 4);

        Controls.Add(root);
    }

    public event EventHandler? CancelRequested;

    public UpdateDialogCloseReason CloseReason { get; private set; } = UpdateDialogCloseReason.Exit;

    public void ApplySnapshot(WindowsUpdateProgressSnapshot snapshot)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => ApplySnapshot(snapshot)));
            return;
        }

        _titleLabel.Text = snapshot.Title;
        _detailLabel.Text = string.IsNullOrWhiteSpace(snapshot.Detail) ? "Подготавливаем обновление." : snapshot.Detail;
        _progressBar.Style = snapshot.IsIndeterminate ? ProgressBarStyle.Marquee : ProgressBarStyle.Continuous;
        if (!snapshot.IsIndeterminate)
        {
            var value = Math.Clamp(snapshot.OverallPercent, 0, 100);
            _progressBar.Value = value;
            _percentLabel.Text = $"{value}%";
        }
        else
        {
            _percentLabel.Text = snapshot.OverallPercent > 0 ? $"{snapshot.OverallPercent}%" : "...";
        }

        var activeIndex = snapshot.Stage switch
        {
            WindowsUpdateStage.Checking => 0,
            WindowsUpdateStage.UpdateAvailable => 0,
            WindowsUpdateStage.Downloading => 1,
            WindowsUpdateStage.Extracting => 2,
            WindowsUpdateStage.Installing => 3,
            WindowsUpdateStage.Launching => 4,
            WindowsUpdateStage.Completed => 4,
            WindowsUpdateStage.Failed => -1,
            _ => -1
        };

        for (var index = 0; index < _stepLabels.Length; index++)
        {
            if (snapshot.Stage == WindowsUpdateStage.Failed)
            {
                _stepLabels[index].ForeColor = Color.FromArgb(120, 128, 123);
                continue;
            }

            _stepLabels[index].ForeColor = index < activeIndex
                ? Color.FromArgb(33, 79, 58)
                : index == activeIndex
                    ? Color.FromArgb(23, 34, 28)
                    : Color.FromArgb(120, 128, 123);
        }

        _canCancel = snapshot.Stage is WindowsUpdateStage.Downloading or WindowsUpdateStage.Extracting or WindowsUpdateStage.Checking;
        _secondaryButton.Enabled = !_running || _canCancel;
        _secondaryButton.Text = _running ? "Отмена" : "Закрыть";
    }

    public void ShowFailure(string message, bool allowLaunchCurrent)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => ShowFailure(message, allowLaunchCurrent)));
            return;
        }

        _running = false;
        _canCancel = false;
        _titleLabel.Text = "Обновление не удалось";
        _detailLabel.Text = message;
        _progressBar.Style = ProgressBarStyle.Continuous;
        _progressBar.Value = 100;
        _percentLabel.Text = "Ошибка";
        foreach (var label in _stepLabels)
        {
            label.ForeColor = Color.FromArgb(140, 60, 60);
        }
        _secondaryButton.Enabled = true;
        _secondaryButton.Text = "Закрыть";
        _primaryButton.Visible = allowLaunchCurrent;
    }

    public void MarkCompleted(string detail, UpdateDialogCloseReason closeReason)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => MarkCompleted(detail, closeReason)));
            return;
        }

        _running = false;
        _canCancel = false;
        _titleLabel.Text = "Обновление завершено";
        _detailLabel.Text = detail;
        _progressBar.Style = ProgressBarStyle.Continuous;
        _progressBar.Value = 100;
        _percentLabel.Text = "100%";
        foreach (var label in _stepLabels)
        {
            label.ForeColor = Color.FromArgb(33, 79, 58);
        }
        CloseReason = closeReason;
        Close();
    }

    public void RequestClose(UpdateDialogCloseReason closeReason)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => RequestClose(closeReason)));
            return;
        }

        _running = false;
        CloseReason = closeReason;
        Close();
    }

    private static Label CreateStepLabel(string text)
    {
        return new Label
        {
            AutoSize = true,
            Text = text,
            Font = new Font("Segoe UI Semibold", 10.5f, FontStyle.Bold, GraphicsUnit.Point),
            ForeColor = Color.FromArgb(120, 128, 123),
            Margin = new Padding(0, 0, 0, 12)
        };
    }
}
