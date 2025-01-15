import { useTranslation } from 'react-i18next';

const Chat = () => {
    const { i18n } = useTranslation();
    
    const sendMessage = async (message) => {
        try {
            const response = await fetch(`${BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    language: i18n.language  // Send current language code
                })
            });
            
            const data = await response.json();
            // Handle response...
        } catch (error) {
            console.error('Error:', error);
        }
    };
    
    // Rest of the component...
}; 