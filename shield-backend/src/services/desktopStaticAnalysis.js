const fs = require('fs/promises');
const path = require('path');
const { buildFinding } = require('../utils/desktopScanHeuristics');

const SAMPLE_BYTES = 1024 * 512;

function entropy(buffer) {
    if (!buffer || buffer.length === 0) return 0;
    const freq = new Map();
    for (const byte of buffer) {
        freq.set(byte, (freq.get(byte) || 0) + 1);
    }
    let result = 0;
    for (const count of freq.values()) {
        const p = count / buffer.length;
        result -= p * Math.log2(p);
    }
    return Number(result.toFixed(3));
}

function detectAsciiIndicators(buffer) {
    const text = buffer.toString('utf8').replace(/\0/g, ' ');
    const indicators = [];
    const patterns = [
        { key: 'download_exec_chain', regex: /(curl|wget).{0,120}(bash|sh)|bash\s+-c|sh\s+-c/i },
        { key: 'powershell_loader', regex: /powershell|invoke-webrequest|start-process/i },
        { key: 'discord_webhook', regex: /discord(?:app)?\.com\/api\/webhooks/i },
        { key: 'telegram_c2', regex: /api\.telegram\.org|t\.me\//i },
        { key: 'base64_blob', regex: /[A-Za-z0-9+/]{180,}={0,2}/ },
        { key: 'suspicious_url', regex: /https?:\/\//i }
    ];
    patterns.forEach((item) => {
        if (item.regex.test(text)) {
            indicators.push(item.key);
        }
    });
    return { text, indicators };
}

function detectMagic(buffer) {
    if (!buffer || buffer.length < 4) return 'unknown';
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) return 'mz';
    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) return 'elf';
    if (buffer[0] === 0x23 && buffer[1] === 0x21) return 'shebang';
    const head = buffer.toString('utf8', 0, Math.min(buffer.length, 128)).trimStart();
    if (head.startsWith('[Desktop Entry]')) return 'desktop-entry';
    if (head.startsWith('<?xml')) return 'xml';
    return 'unknown';
}

async function analyzeDesktopArtifact({ platform, artifactKind, filePath, fileName, metadata = {} }) {
    const stat = await fs.stat(filePath);
    const sample = await fs.readFile(filePath);
    const limited = sample.subarray(0, Math.min(sample.length, SAMPLE_BYTES));
    const observedMagic = detectMagic(limited);
    const sampleEntropy = entropy(limited);
    const { indicators } = detectAsciiIndicators(limited);
    const normalizedName = String(fileName || path.basename(filePath) || '').toLowerCase();
    const findings = [];

    if (platform === 'WINDOWS') {
        if (['EXE', 'DLL', 'MSI', 'EXECUTABLE', 'LIBRARY', 'PACKAGE'].includes(String(artifactKind || '').toUpperCase()) && observedMagic !== 'mz') {
            findings.push(buildFinding({
                type: 'tampered_binary',
                severity: 'high',
                title: 'Исполняемый файл не похож на корректный PE',
                detail: 'Для Windows-артефакта ожидалась сигнатура MZ, но она не найдена.',
                source: 'NeuralV Server Static',
                score: 32,
                evidence: { observed_magic: observedMagic }
            }));
        }
        if (/(loader|stub|patch|keygen|inject|dropper|unlock)/i.test(normalizedName)) {
            findings.push(buildFinding({
                type: 'suspicious_name',
                severity: 'medium',
                title: 'Подозрительное имя файла',
                detail: `Имя файла ${fileName} похоже на loader/patcher utility.`,
                source: 'NeuralV Server Static',
                score: 18,
                evidence: { file_name: fileName }
            }));
        }
    }

    if (platform === 'LINUX') {
        const kind = String(artifactKind || '').toUpperCase();
        const allowedMagics = (kind === 'DESKTOP')
            ? new Set(['desktop-entry', 'xml'])
            : (kind === 'SCRIPT')
                ? new Set(['shebang'])
                : new Set(['elf', 'shebang']);
        if (['ELF', 'APPIMAGE', 'SCRIPT', 'DESKTOP', 'EXECUTABLE', 'PACKAGE', 'ARCHIVE'].includes(kind) && !allowedMagics.has(observedMagic)) {
            findings.push(buildFinding({
                type: 'tampered_binary',
                severity: 'high',
                title: 'Артефакт не совпадает с заявленным типом',
                detail: 'Содержимое файла не соответствует ELF/AppImage/script/.desktop формату.',
                source: 'NeuralV Server Static',
                score: 30,
                evidence: { observed_magic: observedMagic, artifact_kind: kind }
            }));
        }
        if (/(install|daemon|agent|autorun|service|init)/i.test(normalizedName) && indicators.includes('download_exec_chain')) {
            findings.push(buildFinding({
                type: 'script_exec_chain',
                severity: 'high',
                title: 'Сценарий содержит цепочку загрузки и запуска',
                detail: 'Внутри обнаружены команды загрузки и непосредственного исполнения.',
                source: 'NeuralV Server Static',
                score: 28,
                evidence: { file_name: fileName }
            }));
        }
    }

    if (sampleEntropy >= 7.2) {
        findings.push(buildFinding({
            type: 'high_entropy',
            severity: sampleEntropy >= 7.6 ? 'high' : 'medium',
            title: 'Высокая энтропия содержимого',
            detail: 'Файл выглядит упакованным, зашифрованным или обфусцированным.',
            source: 'NeuralV Server Static',
            score: 22,
            evidence: { entropy: sampleEntropy }
        }));
    }

    if (indicators.includes('download_exec_chain') || indicators.includes('powershell_loader')) {
        findings.push(buildFinding({
            type: 'script_exec_chain',
            severity: 'high',
            title: 'Обнаружена цепочка загрузки и исполнения',
            detail: 'Строковый анализ выявил команды загрузки, shell execution или PowerShell loader.',
            source: 'NeuralV Server Static',
            score: 26,
            evidence: { indicators }
        }));
    }

    if (indicators.includes('discord_webhook') || indicators.includes('telegram_c2')) {
        findings.push(buildFinding({
            type: indicators.includes('discord_webhook') ? 'discord_webhook' : 'telegram_c2',
            severity: 'high',
            title: 'Найден потенциальный канал управления',
            detail: 'Внутри файла найдены маркеры webhook/C2-коммуникации.',
            source: 'NeuralV Server Static',
            score: 24,
            evidence: { indicators }
        }));
    }

    return {
        ok: true,
        fileSizeBytes: stat.size,
        observedMagic,
        entropy: sampleEntropy,
        indicators,
        findings
    };
}

module.exports = {
    analyzeDesktopArtifact
};
