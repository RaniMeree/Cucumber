import { Camera } from '@capacitor/camera';
import { useEffect } from 'react';

// Add this at the start of your component
useEffect(() => {
    const checkPermissions = async () => {
        try {
            const permissionState = await Camera.checkPermissions();
            if (permissionState.camera !== 'granted') {
                await Camera.requestPermissions({
                    permissions: ['camera']
                });
            }
        } catch (error) {
            console.error('Error checking camera permissions:', error);
        }
    };

    checkPermissions();
}, []); 