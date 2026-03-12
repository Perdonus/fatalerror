#!/usr/bin/env python3
import argparse
import hashlib
import ipaddress
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

PACKER_MARKERS = {
    'libjiagu': ('high', 'Jiagu packer marker', 'Embedded files match common Qihoo Jiagu protection markers.', 28),
    'libsecneo': ('high', 'SecNeo packer marker', 'Embedded files match common SecNeo protection markers.', 24),
    'ijiami': ('high', 'iJiami packer marker', 'Embedded files match common iJiami protection markers.', 24),
    'bangcle': ('high', 'Bangcle marker', 'Embedded files match common Bangcle protection markers.', 22),
    'libDexHelper': ('medium', 'Dex helper marker', 'The APK bundles a helper often seen in protected or repacked samples.', 14),
    'libprotect': ('medium', 'Protection library marker', 'The APK contains generic protection library naming patterns.', 10),
}

SUSPICIOUS_FILE_PATTERNS = [
    (re.compile(r'assets/.+\.(jar|dex)$', re.I), 'Embedded executable payload', 'Assets contain additional executable payload files.', 18),
    (re.compile(r'lib/.+/(busybox|su|magisk|zygisk)', re.I), 'Root tool marker', 'Native library paths reference root tooling markers.', 20),
    (re.compile(r'.+/payload/.+', re.I), 'Payload directory marker', 'The archive contains payload-style directory names.', 12),
]

URL_RE = re.compile(r'https?://[A-Za-z0-9._~:/?#\[\]@!$&\'()*+,;=%-]{6,220}')
IP_RE = re.compile(r'(?<!\d)((?:\d{1,3}\.){3}\d{1,3})(?!\d)')

STRING_SIGNAL_RULES = [
    (
        'dynamic_loader',
        'medium',
        'Dynamic code loading markers',
        'The APK references dynamic DEX/class loading APIs that are commonly used by droppers, loaders, and heavily obfuscated samples.',
        'Androguard',
        16,
        ['DexClassLoader', 'PathClassLoader', 'InMemoryDexClassLoader', 'BaseDexClassLoader', 'loadDex']
    ),
    (
        'shell_exec',
        'high',
        'Shell execution markers',
        'The APK references shell execution APIs or shell paths that are often abused for privilege checks, rooting logic, or post-install payload execution.',
        'Androguard',
        20,
        ['Runtime.getRuntime().exec', 'ProcessBuilder', '/system/bin/sh', 'su -c']
    ),
    (
        'accessibility_automation',
        'high',
        'Accessibility automation markers',
        'The APK references accessibility automation methods that are frequently used by banking trojans and credential-stealing malware.',
        'Androguard',
        18,
        ['performGlobalAction', 'getRootInActiveWindow', 'AccessibilityService', 'TYPE_WINDOW_STATE_CHANGED']
    ),
    (
        'telegram_c2',
        'high',
        'Telegram bot endpoint marker',
        'The APK contains Telegram bot API markers, which are commonly used for low-cost command-and-control or exfiltration.',
        'Androguard',
        18,
        ['api.telegram.org/bot']
    ),
    (
        'discord_webhook',
        'high',
        'Discord webhook marker',
        'The APK contains Discord webhook endpoints, which are commonly used for data exfiltration or telemetry in suspicious samples.',
        'Androguard',
        18,
        ['discord.com/api/webhooks', 'discordapp.com/api/webhooks']
    ),
    (
        'anti_analysis',
        'medium',
        'Anti-analysis markers',
        'The APK references instrumentation or root-hiding markers associated with anti-analysis and environment checks.',
        'Androguard',
        12,
        ['frida', 'zygisk', 'magisk', 'xposed', 'substrate']
    ),
]

YARA_RULE_MAP = {
    'APK_Packer_Jiagu': ('high', 22, 'YARA match: Jiagu packer marker'),
    'APK_Packer_SecNeo': ('high', 20, 'YARA match: SecNeo marker'),
    'APK_Packer_IJiami': ('high', 20, 'YARA match: iJiami marker'),
    'APK_Risky_Overlay_Strings': ('medium', 12, 'YARA match: overlay/accessibility strings'),
    'APK_C2_Telegram_Bot': ('high', 18, 'YARA match: Telegram bot marker'),
    'APK_C2_Discord_Webhook': ('high', 18, 'YARA match: Discord webhook marker'),
    'APK_Dynamic_Dex_Loader': ('medium', 14, 'YARA match: dynamic dex loader marker'),
    'APK_Shell_Exec': ('high', 18, 'YARA match: shell execution marker'),
    'APK_Accessibility_Abuse_Strings': ('high', 16, 'YARA match: accessibility abuse marker'),
    'APK_Root_Evasion_Strings': ('medium', 12, 'YARA match: root/evasion marker'),
    'APK_Frida_Instrumentation_Strings': ('medium', 12, 'YARA match: Frida instrumentation marker'),
    'APK_Cleartext_URL': ('low', 6, 'YARA match: cleartext URL marker'),
}


def finding(type_name, severity, title, detail, source, score, evidence=None):
    return {
        'type': type_name,
        'severity': severity,
        'title': title,
        'detail': detail,
        'source': source,
        'score': score,
        'evidence': evidence or {}
    }


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def run_command(args, timeout=30, cwd=None):
    try:
        completed = subprocess.run(args, capture_output=True, text=True, timeout=timeout, cwd=cwd)
        return completed.returncode, completed.stdout, completed.stderr
    except Exception as exc:
        return 1, '', str(exc)


def resolve_executable(name):
    local_candidate = os.path.join(os.path.dirname(sys.executable), name)
    if os.path.exists(local_candidate) and os.access(local_candidate, os.X_OK):
        return local_candidate
    return shutil.which(name)


def normalize_public_ips(values, limit=10):
    ips = []
    for value in values:
        try:
            parsed = ipaddress.ip_address(value)
        except ValueError:
            continue
        if parsed.is_private or parsed.is_loopback or parsed.is_multicast or parsed.is_reserved:
            continue
        if value not in ips:
            ips.append(value)
        if len(ips) >= limit:
            break
    return ips


def parse_apkid(path, tool_status):
    apkid = resolve_executable('apkid')
    if not apkid:
        tool_status['apkid'] = 'missing'
        return []
    code, stdout, stderr = run_command([apkid, '-j', path], timeout=40)
    if code != 0 or not stdout.strip():
        tool_status['apkid'] = 'error'
        return []
    tool_status['apkid'] = 'ok'
    try:
        payload = json.loads(stdout)
    except Exception:
        tool_status['apkid'] = 'invalid_json'
        return []

    findings = []
    file_payload = None
    if isinstance(payload, dict):
        if 'files' in payload and isinstance(payload['files'], dict):
            file_payload = next(iter(payload['files'].values()), None)
        else:
            file_payload = next(iter(payload.values()), None)
    if not isinstance(file_payload, dict):
        return []

    candidates = []
    for value in file_payload.values():
        if isinstance(value, list):
            candidates.extend([str(item) for item in value])
        elif isinstance(value, str):
            candidates.append(value)
        elif isinstance(value, dict):
            candidates.extend([str(v) for v in value.values() if isinstance(v, (str, int, float))])

    seen = set()
    for marker in candidates:
        marker = marker.strip()
        if not marker or marker in seen:
            continue
        seen.add(marker)
        findings.append(finding(
            'apkid',
            'medium',
            'APKiD fingerprint',
            f'APKiD identified: {marker}',
            'APKiD',
            12,
            {'marker': marker}
        ))
    return findings[:10]


def parse_yara(path, rules_path, tool_status):
    findings = []
    if not rules_path or not os.path.exists(rules_path):
        tool_status['yara'] = 'rules_missing'
        return findings

    try:
        import yara  # type: ignore

        compiled = yara.compile(filepath=rules_path)
        matches = compiled.match(path)
        tool_status['yara'] = 'ok'
        for match in matches[:20]:
            rule_name = getattr(match, 'rule', None) or str(match)
            severity, score, summary = YARA_RULE_MAP.get(rule_name, ('medium', 10, f'YARA rule matched: {rule_name}'))
            findings.append(finding(
                'yara',
                severity,
                summary,
                f'YARA rule matched: {rule_name}',
                'YARA',
                score,
                {'rule': rule_name}
            ))
        return findings
    except Exception:
        pass

    yara_cli = resolve_executable('yara')
    if not yara_cli:
        tool_status['yara'] = 'missing'
        return findings
    code, stdout, stderr = run_command([yara_cli, '-r', rules_path, path], timeout=25)
    if code not in (0, 1):
        tool_status['yara'] = 'error'
        return findings
    tool_status['yara'] = 'ok'
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        rule_name = line.split()[0]
        severity, score, summary = YARA_RULE_MAP.get(rule_name, ('medium', 10, f'YARA rule matched: {rule_name}'))
        findings.append(finding(
            'yara',
            severity,
            summary,
            f'YARA rule matched: {rule_name}',
            'YARA',
            score,
            {'rule': rule_name}
        ))
    return findings[:20]


def parse_aapt_permissions(path, tool_status):
    aapt = resolve_executable('aapt')
    if not aapt:
        tool_status['aapt'] = 'missing'
        return []
    code, stdout, stderr = run_command([aapt, 'dump', 'badging', path], timeout=25)
    if code != 0:
        tool_status['aapt'] = 'error'
        return []
    tool_status['aapt'] = 'ok'
    permissions = []
    for line in stdout.splitlines():
        line = line.strip()
        if line.startswith('uses-permission:'):
            match = re.search(r"name='([^']+)'", line)
            if match:
                permissions.append(match.group(1))
    return permissions


def parse_androguard(path, tool_status):
    try:
        from androguard.misc import AnalyzeAPK  # type: ignore
    except Exception:
        tool_status['androguard'] = 'missing'
        return [], {}

    try:
        apk, dex_list, _analysis = AnalyzeAPK(path)
    except Exception as exc:
        tool_status['androguard'] = 'error'
        return [], {'error': str(exc)}

    tool_status['androguard'] = 'ok'
    findings = []
    metadata = {
        'package_name': apk.get_package(),
        'app_name': apk.get_app_name(),
        'main_activity': apk.get_main_activity(),
        'activities_count': len(apk.get_activities() or []),
        'services_count': len(apk.get_services() or []),
        'receivers_count': len(apk.get_receivers() or []),
        'providers_count': len(apk.get_providers() or []),
        'permissions': (apk.get_permissions() or [])[:64],
        'target_sdk': apk.get_target_sdk_version(),
        'min_sdk': apk.get_min_sdk_version(),
    }

    all_strings = []
    string_cap = 16000
    for dex in dex_list or []:
        try:
            strings = dex.get_strings() or []
        except Exception:
            continue
        for value in strings:
            if not value:
                continue
            all_strings.append(str(value))
            if len(all_strings) >= string_cap:
                break
        if len(all_strings) >= string_cap:
            break

    urls = []
    for value in all_strings:
        for match in URL_RE.findall(value):
            if match.startswith('https://schemas.android.com/'):
                continue
            if match not in urls:
                urls.append(match)
            if len(urls) >= 20:
                break
        if len(urls) >= 20:
            break

    public_ips = normalize_public_ips(IP_RE.findall('\n'.join(all_strings)))
    metadata['dex_url_count'] = len(urls)
    metadata['dex_urls'] = urls[:10]
    metadata['dex_public_ips'] = public_ips[:10]

    if any(url.startswith('http://') for url in urls):
        findings.append(finding(
            'cleartext_endpoint',
            'medium',
            'Cleartext endpoints found in DEX strings',
            'The APK contains HTTP endpoints in code strings, which weakens transport security and can indicate low-trust infrastructure.',
            'Androguard',
            12,
            {'urls': [url for url in urls if url.startswith('http://')][:6]}
        ))

    if public_ips:
        findings.append(finding(
            'hardcoded_ip',
            'medium',
            'Hardcoded public IP addresses',
            'The APK contains hardcoded public IP addresses in code strings, which deserves review because malware often hardcodes fallback infrastructure.',
            'Androguard',
            12,
            {'ips': public_ips[:6]}
        ))

    lowered_strings = [value.lower() for value in all_strings]
    for type_name, severity, title, detail, source, score, markers in STRING_SIGNAL_RULES:
        matched = []
        for marker in markers:
            needle = marker.lower()
            if any(needle in candidate for candidate in lowered_strings):
                matched.append(marker)
        if matched:
            findings.append(finding(
                type_name,
                severity,
                title,
                detail,
                source,
                score,
                {'markers': matched[:6]}
            ))

    if metadata['receivers_count'] >= 8 and metadata['services_count'] >= 6:
        findings.append(finding(
            'component_surface',
            'medium',
            'Large background component surface',
            'The APK declares many services and broadcast receivers, which can indicate an aggressive background footprint that deserves extra review.',
            'Androguard',
            10,
            {
                'services_count': metadata['services_count'],
                'receivers_count': metadata['receivers_count']
            }
        ))

    return findings, metadata


def parse_quark(path, tool_status):
    quark = resolve_executable('quark')
    rules_dir = os.environ.get('QUARK_RULES_DIR') or os.path.expanduser('~/.quark-engine/quark-rules')
    if not quark:
        tool_status['quark'] = 'missing'
        return [], {}
    if not os.path.isdir(rules_dir):
        tool_status['quark'] = 'rules_missing'
        return [], {'rules_dir': rules_dir}

    with tempfile.TemporaryDirectory(prefix='quark-report-') as tmpdir:
        report_path = os.path.join(tmpdir, 'report.json')
        code, stdout, stderr = run_command(
            [quark, '-a', path, '-r', rules_dir, '-o', report_path],
            timeout=70
        )
        if code != 0 or not os.path.exists(report_path):
            tool_status['quark'] = 'error'
            return [], {'error': (stderr or stdout).strip()[:300], 'rules_dir': rules_dir}
        try:
            with open(report_path, 'r', encoding='utf-8') as handle:
                payload = json.load(handle)
        except Exception as exc:
            tool_status['quark'] = 'invalid_json'
            return [], {'error': str(exc), 'rules_dir': rules_dir}

    tool_status['quark'] = 'ok'
    crimes = payload.get('crimes') or payload.get('crime') or []
    if isinstance(crimes, dict):
        crimes = list(crimes.values())

    findings = []
    for crime in crimes[:10]:
        if isinstance(crime, dict):
            name = str(crime.get('crime') or crime.get('name') or crime.get('label') or 'Suspicious behavior').strip()
            score_value = crime.get('score') or crime.get('weight') or 0
            confidence = crime.get('confidence') or crime.get('confidence_score')
        else:
            name = str(crime).strip()
            score_value = 0
            confidence = None

        try:
            numeric_score = float(score_value)
        except Exception:
            numeric_score = 0.0

        severity = 'high' if numeric_score >= 4 else 'medium' if numeric_score >= 2 else 'low'
        findings.append(finding(
            'quark_rule',
            severity,
            'Quark rule matched suspicious behavior',
            f'Quark-Engine matched behavior: {name}',
            'Quark-Engine',
            min(24, max(8, int(numeric_score * 4) if numeric_score > 0 else 10)),
            {
                'crime': name,
                'score': numeric_score,
                'confidence': confidence
            }
        ))

    metadata = {
        'rules_dir': rules_dir,
        'crime_count': len(crimes),
        'threat_level': payload.get('threat_level'),
        'total_score': payload.get('total_score'),
        'summary': payload.get('summary')
    }
    return findings, metadata


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apk', required=True)
    parser.add_argument('--rules', default='')
    args = parser.parse_args()

    result = {
        'ok': True,
        'metadata': {},
        'findings': [],
        'risk_bonus': 0,
        'sources': []
    }
    tool_status = {}

    try:
        apk_path = os.path.abspath(args.apk)
        if not os.path.exists(apk_path):
            raise FileNotFoundError('APK file not found')

        result['metadata']['file_size'] = os.path.getsize(apk_path)
        result['metadata']['sha256'] = sha256_file(apk_path)

        with zipfile.ZipFile(apk_path, 'r') as archive:
            names = archive.namelist()
            lower_names = [name.lower() for name in names]
            result['metadata']['entry_count'] = len(names)
            result['metadata']['dex_count'] = sum(1 for name in lower_names if name.endswith('.dex'))
            result['metadata']['native_lib_count'] = sum(1 for name in lower_names if name.startswith('lib/') and name.endswith('.so'))
            result['metadata']['has_manifest'] = 'androidmanifest.xml' in lower_names

            if 'androidmanifest.xml' not in lower_names:
                result['findings'].append(finding(
                    'apk_structure',
                    'high',
                    'Missing AndroidManifest.xml',
                    'The uploaded archive does not contain an Android manifest and does not look like a valid APK.',
                    'APK Structure',
                    40
                ))

            if result['metadata']['dex_count'] == 0:
                result['findings'].append(finding(
                    'apk_structure',
                    'high',
                    'Missing classes.dex',
                    'No DEX bytecode files were found inside the uploaded APK.',
                    'APK Structure',
                    35
                ))
            elif result['metadata']['dex_count'] > 4:
                result['findings'].append(finding(
                    'apk_structure',
                    'medium',
                    'Many DEX files',
                    'The APK contains many DEX files, which can indicate aggressive modularization, heavy obfuscation or repacking.',
                    'APK Structure',
                    12,
                    {'dex_count': result['metadata']['dex_count']}
                ))

            for marker, descriptor in PACKER_MARKERS.items():
                matched = [name for name in names if marker.lower() in name.lower()]
                if matched:
                    severity, title, detail, score = descriptor
                    result['findings'].append(finding(
                        'packer_marker',
                        severity,
                        title,
                        detail,
                        'APK Structure',
                        score,
                        {'matches': matched[:6]}
                    ))

            for pattern, title, detail, score in SUSPICIOUS_FILE_PATTERNS:
                matched = [name for name in names if pattern.search(name)]
                if matched:
                    result['findings'].append(finding(
                        'apk_payload',
                        'medium',
                        title,
                        detail,
                        'APK Structure',
                        score,
                        {'matches': matched[:6]}
                    ))

        permissions = parse_aapt_permissions(apk_path, tool_status)
        if permissions:
            result['metadata']['aapt_permissions'] = permissions[:64]
            if 'android.permission.SYSTEM_ALERT_WINDOW' in permissions and 'android.permission.BIND_ACCESSIBILITY_SERVICE' in permissions:
                result['findings'].append(finding(
                    'permission_combo',
                    'high',
                    'Overlay + accessibility confirmed from APK',
                    'The packaged manifest confirms both overlay and accessibility capabilities.',
                    'AAPT',
                    18
                ))

        result['findings'].extend(parse_apkid(apk_path, tool_status))
        result['findings'].extend(parse_yara(apk_path, args.rules, tool_status))

        androguard_findings, androguard_metadata = parse_androguard(apk_path, tool_status)
        result['findings'].extend(androguard_findings)
        if androguard_metadata:
            result['metadata']['androguard'] = androguard_metadata

        quark_findings, quark_metadata = parse_quark(apk_path, tool_status)
        result['findings'].extend(quark_findings)
        if quark_metadata:
            result['metadata']['quark'] = quark_metadata

        result['metadata']['tool_status'] = tool_status
        result['risk_bonus'] = min(100, sum(int(item.get('score', 0)) for item in result['findings']))

        grouped = {}
        for item in result['findings']:
            grouped.setdefault(item['source'], []).append(item)
        result['sources'] = [
            {
                'source': source,
                'count': len(items),
                'summary': '; '.join(entry['title'] for entry in items[:3])
            }
            for source, items in grouped.items()
        ]
    except Exception as exc:
        result = {
            'ok': False,
            'error': str(exc),
            'metadata': {'tool_status': tool_status},
            'findings': [],
            'risk_bonus': 0,
            'sources': []
        }

    json.dump(result, sys.stdout, ensure_ascii=False)


if __name__ == '__main__':
    main()
