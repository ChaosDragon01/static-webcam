document.addEventListener('DOMContentLoaded', async () => {
    const videoElement = document.getElementById('webcam');
    const errorMessage = document.getElementById('error-message');
    const captureBtn = document.getElementById('capture-btn');
    const toggleBtn = document.getElementById('toggle-btn');
    
    let currentStream = null;
    let useFrontCamera = true;

    // Request webcam access and stream to video element
    const startCamera = async (useFront) => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // Exact constraints for front/rear camera toggling
        const constraints = {
            video: {
                facingMode: useFront ? 'user' : { exact: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = currentStream;
            errorMessage.classList.remove('visible');

            // FIX 1: Dynamically mirror the live preview element for the front camera only
            if (useFront) {
                videoElement.style.transform = 'scaleX(-1)';
            } else {
                videoElement.style.transform = 'scaleX(1)';
            }
        } catch (err) {
            console.error("Camera access denied or hardware error:", err);
            showError("Unable to access the camera. Please ensure permissions are granted and no other app is using it.");
        }
    };

    // Handle and display errors
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
        videoElement.srcObject = null;
    };

    // Initialize camera on page load
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await startCamera(useFrontCamera);
    } else {
        showError("getUserMedia is not supported by your browser.");
    }

    // Toggle Camera (front/back) if multiple cameras are available
    toggleBtn.addEventListener('click', async () => {
        useFrontCamera = !useFrontCamera;
        await startCamera(useFrontCamera);
    });

    // Capture Photo functionality
    captureBtn.addEventListener('click', () => {
        if (!currentStream) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d');

        // FIX 2: Horizontally flip the canvas context if using the front camera
        // This ensures the downloaded image matches exactly what the user saw on screen
        if (useFrontCamera) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert frame to image and trigger download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `webcam-capture-${new Date().getTime()}.png`;
        link.click();
    });
});
