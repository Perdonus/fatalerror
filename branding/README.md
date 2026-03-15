## NeuralV Brand Kit

This directory is the shared source of truth for cross-surface NeuralV branding.

Files:
- `neuralv.tokens.json`: brand name, palette, typography, icon rules and download labels
- `neuralv-logo.svg`: neutral hero asset for web, desktop splash and installer surfaces

Rules:
- Product name: `NeuralV`
- Android `applicationId` stays `com.shield.antivirus` in v1 for upgrade compatibility
- Native clients may layer dynamic colors over the fallback palette
- Web uses the fallback palette directly and does not attempt wallpaper extraction
