rule APK_Packer_Jiagu {
    strings:
        $a = "libjiagu" ascii nocase
    condition:
        $a
}

rule APK_Packer_SecNeo {
    strings:
        $a = "libsecneo" ascii nocase
    condition:
        $a
}

rule APK_Packer_IJiami {
    strings:
        $a = "ijiami" ascii nocase
    condition:
        $a
}

rule APK_Risky_Overlay_Strings {
    strings:
        $a = "SYSTEM_ALERT_WINDOW" ascii
        $b = "BIND_ACCESSIBILITY_SERVICE" ascii
    condition:
        any of them
}

rule APK_C2_Telegram_Bot {
    strings:
        $a = "api.telegram.org/bot" ascii nocase
    condition:
        $a
}

rule APK_C2_Discord_Webhook {
    strings:
        $a = "discord.com/api/webhooks" ascii nocase
        $b = "discordapp.com/api/webhooks" ascii nocase
    condition:
        any of them
}

rule APK_Dynamic_Dex_Loader {
    strings:
        $a = "DexClassLoader" ascii
        $b = "PathClassLoader" ascii
        $c = "InMemoryDexClassLoader" ascii
        $d = "loadDex" ascii
    condition:
        any of them
}

rule APK_Shell_Exec {
    strings:
        $a = "Runtime.getRuntime().exec" ascii
        $b = "/system/bin/sh" ascii
        $c = "ProcessBuilder" ascii
        $d = "su -c" ascii nocase
    condition:
        any of them
}

rule APK_Accessibility_Abuse_Strings {
    strings:
        $a = "performGlobalAction" ascii
        $b = "getRootInActiveWindow" ascii
        $c = "AccessibilityService" ascii
    condition:
        2 of them
}

rule APK_Root_Evasion_Strings {
    strings:
        $a = "magisk" ascii nocase
        $b = "zygisk" ascii nocase
        $c = "busybox" ascii nocase
        $d = "supersu" ascii nocase
    condition:
        any of them
}

rule APK_Frida_Instrumentation_Strings {
    strings:
        $a = "frida" ascii nocase
        $b = "gum-js-loop" ascii nocase
        $c = "libfrida" ascii nocase
    condition:
        any of them
}

rule APK_Cleartext_URL {
    strings:
        $a = "http://" ascii
    condition:
        $a
}
