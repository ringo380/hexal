// useInlineEdit - Reusable inline editing state management
import { useState, useRef, useEffect, useCallback } from 'react';

interface UseInlineEditOptions<T> {
  onSave: (item: T) => void;
}

export function useInlineEdit<T>({ onSave }: UseInlineEditOptions<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<T | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startEditing = useCallback((item: T) => {
    setDraft(item);
    setIsEditing(true);
  }, []);

  const save = useCallback(() => {
    if (draft) {
      onSave(draft);
    }
    setIsEditing(false);
    setDraft(null);
  }, [draft, onSave]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setDraft(null);
  }, []);

  // Outside click to cancel
  useEffect(() => {
    if (!isEditing) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        cancel();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancel();
      }
    };

    // Delay listener to avoid catching the click that started editing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, cancel]);

  return { isEditing, draft, setDraft, startEditing, save, cancel, containerRef };
}
