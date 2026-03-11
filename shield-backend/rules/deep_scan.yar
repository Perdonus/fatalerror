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
