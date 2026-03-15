plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.compose.desktop)
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":desktop-core"))
    implementation(compose.desktop.currentOs)
    implementation(compose.material3)
    implementation(compose.foundation)
    implementation(compose.materialIconsExtended)
    implementation(libs.kotlinx.coroutines.swing)
}

compose.desktop {
    application {
        mainClass = "com.neuralv.desktop.app.MainKt"

        nativeDistributions {
            packageName = "NeuralV"
            packageVersion = "1.0.0"
            description = "NeuralV desktop security client"
            vendor = "NeuralV"
        }
    }
}
