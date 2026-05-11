# SynthPass v2.0: The Zero-Vault Password Synthesizer

**SynthPass** is a deterministic security tool that replaces the traditional, vulnerable "password vault" with a mathematical engine. It doesn't store your passwords; it **synthesizes** them on the fly.

## 🛡️ The Philosophy: "Servers are Evil"
Conventional managers ask you to trust a central database that can be hacked or leaked. SynthPass eliminates this target. Your passwords exist only for the split second you need them, generated locally from your **Master Key (MK)** and the website's domain.

## 🚀 Key Features in v2.0
* **Dual-Engine Logic:** Version 2.0 features a superior synthesis engine. Use the **Classic Mode** toggle for full backward compatibility with legacy passwords.
* **The Vault (Local Storage):** A secure, local-only space to store site-specific **Encrypted Notes** or unique passwords that cannot be synthesized.
* **Security Auto-Wipe:** Your Master Key is never stored and is purged from volatile memory after five minutes of inactivity.
* **WiseHash™ Key-Stretching:** Employs high-entropy **SCRYPT** iterations to harden your Master Key against brute-force attacks.

## 📱 Mobile & External Access
Since the engine is purely mathematical, you can generate identical passwords on any device:
* **New v2.0 Algorithm:** [https://privacybar.net/mobile](https://privacybar.net/mobile) (Password tab)
* **Classic Algorithm:** [https://synthpass.com/app](https://synthpass.com/app)

## 🛠️ Verification & Audit
We believe in **"Don't Trust, Verify."** You can audit the code running in your browser against our official source.

1.  **Find Extension Folder:** Locate ID `khkpfnickpejcjhajmkljfadcaegphkd` in your browser's extension directory.
2.  **Verify Hashes:** * Download `hashes.txt` to the folder.
    * Run `shasum -a 256 -c hashes.txt`.

## 📜 Sovereignty & License
**Copyright © 2026 Francisco Ruiz. All rights reserved.**

To protect this project from commercial exploitation while keeping it open for public audit, SynthPass is released under the **PolyForm Shield License 1.0.0**—ensuring the code remains open for you, but closed to commercial exploitation.
* **Personal/Academic Use:** Fully permitted.
* **Commercial Redistribution:** Strictly prohibited.
* **Audit Rights:** Everyone is encouraged to read and verify the source code.

---

### 💎 Upgrade to Privacy Bar
For the full security suite—including post-quantum encryption (ML-KEM), steganography, and secure file management—check out [Privacy Bar](https://privacybar.net), which includes the full SynthPass 2.0 engine.

---
