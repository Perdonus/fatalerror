const path = require('path');
const { spawn } = require('child_process');

const ANALYZER_TIMEOUT_MS = parseInt(process.env.APK_ANALYZER_TIMEOUT_MS || '1200000', 10);
const ANALYZER_PYTHON = process.env.APK_ANALYZER_PYTHON || 'python3';

function runAnalyzer(apkPath, options = {}) {
    const signal = options?.signal;
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'analyze_apk.py');
        const rulesPath = path.join(__dirname, '..', '..', 'rules', 'deep_scan.yar');
        if (signal?.aborted) {
            resolve({
                ok: false,
                cancelled: true,
                error: 'APK analyzer cancelled',
                findings: [],
                metadata: {},
                risk_bonus: 0,
                sources: []
            });
            return;
        }
        const child = spawn(ANALYZER_PYTHON, [scriptPath, '--apk', apkPath, '--rules', rulesPath], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';
        let settled = false;
        let abortHandler = null;
        const finish = (payload) => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            if (signal && abortHandler) {
                signal.removeEventListener('abort', abortHandler);
            }
            resolve(payload);
        };
        const timer = ANALYZER_TIMEOUT_MS > 0 ? setTimeout(() => {
            child.kill('SIGKILL');
            finish({
                ok: false,
                error: 'APK analyzer timed out',
                findings: [],
                metadata: {},
                risk_bonus: 0,
                sources: []
            });
        }, ANALYZER_TIMEOUT_MS) : null;

        if (signal) {
            abortHandler = () => {
                child.kill('SIGKILL');
                finish({
                    ok: false,
                    cancelled: true,
                    error: 'APK analyzer cancelled',
                    findings: [],
                    metadata: {},
                    risk_bonus: 0,
                    sources: []
                });
            };
            signal.addEventListener('abort', abortHandler, { once: true });
        }

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });
        child.on('error', (error) => {
            finish({
                ok: false,
                error: error.message,
                findings: [],
                metadata: {},
                risk_bonus: 0,
                sources: []
            });
        });
        child.on('close', () => {
            if (settled) {
                return;
            }
            try {
                const parsed = JSON.parse(stdout || '{}');
                finish({
                    ok: Boolean(parsed.ok),
                    error: parsed.error || (stderr.trim() || null),
                    cancelled: Boolean(parsed.cancelled),
                    findings: Array.isArray(parsed.findings) ? parsed.findings : [],
                    metadata: parsed.metadata || {},
                    risk_bonus: Number(parsed.risk_bonus || 0),
                    sources: Array.isArray(parsed.sources) ? parsed.sources : []
                });
            } catch (_) {
                finish({
                    ok: false,
                    error: stderr.trim() || 'APK analyzer returned invalid JSON',
                    findings: [],
                    metadata: {},
                    risk_bonus: 0,
                    sources: []
                });
            }
        });
    });
}

module.exports = {
    runAnalyzer
};
