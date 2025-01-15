import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

// Add this function to request permissions
async function requestPermissions() {
  if (Capacitor.getPlatform() !== 'web') {
    const { camera } = Camera;
    await camera.requestPermissions();
  }
}

// Call this when component mounts or before using camera
useEffect(() => {
  requestPermissions();
}, []);