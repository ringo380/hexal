// connectionManager — Simple online/offline detection service.
// Uses browser `navigator.onLine` and online/offline events to track
// connectivity state and notify subscribers.

type ConnectionListener = (online: boolean) => void;

class ConnectionManager {
  private listeners: Set<ConnectionListener> = new Set();
  private _online: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
  }

  /** Current connectivity state. */
  get online(): boolean {
    return this._online;
  }

  private setOnline(value: boolean): void {
    if (this._online === value) return;
    this._online = value;
    // Use Array.from().forEach() instead of for...of (ES3 compat for electron/)
    Array.from(this.listeners).forEach(listener => listener(value));
  }

  /**
   * Subscribe to connectivity changes.
   * The listener is called with `true` when going online, `false` when going offline.
   * Returns an unsubscribe function.
   */
  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const connectionManager = new ConnectionManager();
