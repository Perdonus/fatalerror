#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
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
    (re.compile(r'assets/.+\\.(jar|dex)$', re.I), 'Embedded executable payload', 'Assets contain additional executable payload files.', 18),
    (re.compile(r'lib/.+/(busybox|su|magisk|zygisk)', re.I), 'Root tool marker', 'Native library paths reference root tooling markers.', 20),
    (re.compile(r'.+/payload/.+', re.I), 'Payload directory marker', 'The archive contains payload-style directory names.', 12),
]


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


def run_command(args, timeout=30):
    try:
        completed = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return completed.returncode, completed.stdout, completed.stderr
    except Exception as exc:
        return 1, '', str(exc)


def parse_apkid(path):
    apkid = shutil.which('apkid')
    if not apkid:
        return []
    code, stdout, stderr = run_command([apkid, '-j', path], timeout=40)
    if code != 0 or not stdout.strip():
        return []
    try:
        payload = json.loads(stdout)
    except Exception:
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


def parse_yara(path, rules_path):
    yara = shutil.which('yara')
    if not yara or not rules_path or not os.path.exists(rules_path):
        return []
    code, stdout, stderr = run_command([yara, '-r', rules_path, path], timeout=25)
    if code not in (0, 1):
        return []
    findings = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        rule_name = line.split()[0]
        findings.append(finding(
            'yara',
            'medium',
            'YARA match',
            f'YARA rule matched: {rule_name}',
            'YARA',
            10,
            {'rule': rule_name}
        ))
    return findings[:12]


def parse_aapt_permissions(path):
    aapt = shutil.which('aapt')
    if not aapt:
        return []
    code, stdout, stderr = run_command([aapt, 'dump', 'badging', path], timeout=25)
    if code != 0:
        return []
    permissions = []
    for line in stdout.splitlines():
        line = line.strip()
        if line.startswith('uses-permission:'):
            match = re.search(r"name='([^']+)'", line)
            if match:
                permissions.append(match.group(1))
    return permissions


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

        permissions = parse_aapt_permissions(apk_path)
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

        result['findings'].extend(parse_apkid(apk_path))
        result['findings'].extend(parse_yara(apk_path, args.rules))
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
            'metadata': {},
            'findings': [],
            'risk_bonus': 0,
            'sources': []
        }

    json.dump(result, sys.stdout, ensure_ascii=False)


if __name__ == '__main__':
    main()
