// MessageToast — Auto-dismissing toast notification for incoming DM messages

import { useEffect } from 'react';

interface DmMessage {
  id: string;
  text: string;
  timestamp: number;
  imageDataUrl?: string;
}

interface MessageToastProps {
  message: DmMessage;
  onDismiss: () => void;
}

function MessageToast({ message, onDismiss }: MessageToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="message-toast" onClick={onDismiss}>
      <div className="message-toast-content">
        {message.text && <p>{message.text}</p>}
        {message.imageDataUrl && (
          <img src={message.imageDataUrl} alt="DM image" className="message-toast-image" />
        )}
      </div>
    </div>
  );
}

export default MessageToast;
