// DmMessagePanel — Floating panel for the DM to send messages to the player view

import { useState, useRef } from 'react';

interface DmMessagePanelProps {
  onClose: () => void;
}

function DmMessagePanel({ onClose }: DmMessagePanelProps) {
  const [text, setText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() && !imageDataUrl) return;

    const message = {
      id: crypto.randomUUID(),
      text: text.trim(),
      timestamp: Date.now(),
      ...(imageDataUrl ? { imageDataUrl } : {}),
    };

    window.electronAPI.sendPlayerMessage(message);
    setText('');
    setImageDataUrl(null);
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="dm-message-panel">
      <div className="dm-message-panel-header">
        <h3>Send to Players</h3>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
      </div>
      <div className="dm-message-panel-body">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message for players..."
          rows={3}
          autoFocus
        />
        {imageDataUrl && (
          <div className="dm-message-preview">
            <img src={imageDataUrl} alt="Attached" />
            <button onClick={() => setImageDataUrl(null)} aria-label="Remove image">&times;</button>
          </div>
        )}
        <div className="dm-message-panel-actions">
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            Attach Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageAttach}
          />
          <button className="btn-primary" onClick={handleSend} disabled={!text.trim() && !imageDataUrl}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default DmMessagePanel;
