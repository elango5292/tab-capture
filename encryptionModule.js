// Include CryptoJS library in your project (e.g., via CDN or npm)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>

class AESEncryptor {
    constructor() {
        // Secret key (in production, this should be user-generated and securely stored)
        this.secretKey = "mySecretKey1234567890123456789012"; // 32 bytes for AES-256
    }

    // Generate a random initialization vector (IV) for each encryption
    generateIV() {
        return CryptoJS.lib.WordArray.random(16); // 16 bytes for AES
    }

    encryptVideo(videoData) {
        try {
            const iv = this.generateIV();
            const encrypted = CryptoJS.AES.encrypt(
                videoData,
                this.secretKey,
                {
                    iv: iv,
                    mode: CryptoJS.mode.CBC, // Cipher Block Chaining mode
                    padding: CryptoJS.pad.Pkcs7
                }
            );
            // Combine IV and encrypted data for storage
            return iv.toString() + ":" + encrypted.toString();
        } catch (error) {
            console.error("Encryption failed:", error);
            return null;
        }
    }

    // Decrypt the video data (expects the combined IV:encrypted string)
    decryptVideo(encryptedData) {
        try {
            const parts = encryptedData.split(":");
            const iv = CryptoJS.enc.Hex.parse(parts[0]);
            const encrypted = parts[1];
            const decrypted = CryptoJS.AES.decrypt(
                encrypted,
                this.secretKey,
                {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            );
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error("Decryption failed:", error);
            return null;
        }
    }

    // Example usage: Encrypt and decrypt a video file (as base64)
    async processVideo(videoBlob) {
        // Convert video blob to base64
        const videoBase64 = await this.blobToBase64(videoBlob);
        if (!videoBase64) return null;

        // Encrypt the video
        const encryptedVideo = this.encryptVideo(videoBase64);
        if (!encryptedVideo) return null;

        console.log("Encrypted Video:", encryptedVideo);

        // Decrypt for verification (optional)
        const decryptedVideo = this.decryptVideo(encryptedVideo);
        console.log("Decrypted Video (Base64):", decryptedVideo);

        return encryptedVideo;
    }

    // Helper: Convert blob to base64
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(",")[1]); // Remove "data:..." prefix
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

// Example usage in your screen recorder
// const encryptor = new AESEncryptor();
// const videoBlob = ...; // Your final video output as a Blob
// encryptor.processVideo(videoBlob).then(encrypted => {
//     // Save or share the encrypted video
// });
