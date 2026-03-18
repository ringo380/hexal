// MessageHistory — Scrollable panel showing all DM messages received this session

import { forwardRef } from 'react';

interface DmMessage {
  id: string;
  text: string;
  timestamp: number;
  imageDataUrl?: string;
}

interface MessageHistoryProps {
  messages: DmMessage[];
  onClose: () => void;
}

const MessageHistory = forwardRef<HTMLDivElement, MessageHistoryProps>(
  function MessageHistory({ messages, onClose }, ref) {
    return (
      <div className="message-history" ref={ref}>
        <div className="message-history-header">
          <h3>Messages from DM</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="message-history-list">
          {messages.length === 0 ? (
            <p className="message-history-empty">No messages yet</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="message-history-item">
                <span className="message-history-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
                {msg.text && <p>{msg.text}</p>}
                {msg.imageDataUrl && (
                  <img src={msg.imageDataUrl} alt="DM image" className="message-history-image" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
);

export default MessageHistory;
