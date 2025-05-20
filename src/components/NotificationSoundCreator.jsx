// Sample notification sound in base64 format
// This is to be saved as a file in your public/sounds directory
const NOTIFICATION_SOUND_BASE64 = `
data:audio/mp3;base64,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
`;

// Function to create the notification sound file
const createNotificationSound = () => {
  // Check if file already exists to avoid recreation
  const checkSound = async () => {
    try {
      const response = await fetch('/sounds/notification.mp3');
      if (response.status === 404) {
        createSoundFile();
      }
    } catch (error) {
      console.error("Error checking sound file:", error);
      // Proceed to create the file if there's an error checking
      createSoundFile();
    }
  };
  
  const createSoundFile = () => {
    // Convert base64 to blob
    const byteString = atob(NOTIFICATION_SOUND_BASE64.split(',')[1]);
    const mimeString = NOTIFICATION_SOUND_BASE64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const url = URL.createObjectURL(blob);
    
    // Create a link to download the sound file
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'notification.mp3';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  checkSound();
};

// Call this function when setting up your application
createNotificationSound();