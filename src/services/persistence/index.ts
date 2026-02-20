// Persistence adapter factory

export type { PersistenceAdapter, CampaignListItem, SaveResult, LoadResult, DeleteResult } from './types';
export { LocalPersistenceAdapter } from './localAdapter';
export { CloudPersistenceAdapter } from './cloudAdapter';

import type { SupabaseClient } from '@supabase/supabase-js';
import { LocalPersistenceAdapter } from './localAdapter';
import { CloudPersistenceAdapter } from './cloudAdapter';
import type { PersistenceAdapter } from './types';

export type AdapterType = 'local' | 'cloud';

export interface CloudAdapterConfig {
  client: SupabaseClient;
  userId: string;
}

/** Create a persistence adapter. Pass config for cloud mode. */
export function createPersistenceAdapter(type: 'local'): PersistenceAdapter;
export function createPersistenceAdapter(type: 'cloud', config: CloudAdapterConfig): PersistenceAdapter;
export function createPersistenceAdapter(type: AdapterType = 'local', config?: CloudAdapterConfig): PersistenceAdapter {
  switch (type) {
    case 'local':
      return new LocalPersistenceAdapter();
    case 'cloud':
      if (!config) throw new Error('Cloud adapter requires config (client + userId)');
      return new CloudPersistenceAdapter(config.client, config.userId);
    default:
      return new LocalPersistenceAdapter();
  }
}
