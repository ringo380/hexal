// cloudStorage — Typed Supabase CRUD wrappers for campaign data
// All functions take a SupabaseClient as the first parameter so callers
// control client lifecycle (via getSupabaseClient).

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Campaign, Hex, Region } from '../types';
import { CAMPAIGN_SCHEMA_VERSION } from '../types/Campaign';

// ============ ROW TYPES (mirror Supabase table schemas) ============

export interface CampaignRow {
  id: string;
  owner_id: string;
  name: string;
  grid_width: number;
  grid_height: number;
  terrain_types: unknown;
  encounter_tables: unknown;
  time_weather: unknown;
  marker_types: unknown;
  encounter_templates: unknown;
  bookmarked_hexes: unknown;
  generation_config: unknown;
  landmark_tables: unknown;
  factions: unknown;
  sessions: unknown;
  session_log: unknown;
  schema_version: number;
  version: number;
  last_modified_by: string | null;
  created_at: string;
  modified_at: string;
}

export interface HexRow {
  id: string;
  campaign_id: string;
  hex_key: string;
  data: unknown;
  version: number;
  modified_at: string;
}

export interface RegionRow {
  id: string;
  campaign_id: string;
  data: unknown;
  version: number;
  modified_at: string;
}

export interface CampaignMemberRow {
  id: string;
  campaign_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

// ============ HELPER: Campaign <-> Row conversion ============

function campaignToRow(campaign: Campaign, userId: string): Omit<CampaignRow, 'created_at'> {
  return {
    id: campaign.id,
    owner_id: userId,
    name: campaign.name,
    grid_width: campaign.gridWidth,
    grid_height: campaign.gridHeight,
    terrain_types: campaign.terrainTypes,
    encounter_tables: campaign.encounterTables,
    time_weather: campaign.timeWeather ?? null,
    marker_types: campaign.markerTypes ?? null,
    encounter_templates: campaign.encounterTemplates ?? [],
    bookmarked_hexes: campaign.bookmarkedHexes ?? [],
    generation_config: campaign.generationConfig ?? null,
    landmark_tables: campaign.landmarkTables ?? [],
    factions: campaign.factions ?? [],
    sessions: campaign.sessions ?? [],
    session_log: campaign.sessionLog ?? [],
    schema_version: campaign.schemaVersion ?? CAMPAIGN_SCHEMA_VERSION,
    version: (campaign.version ?? 0) + 1,
    last_modified_by: userId,
    modified_at: new Date().toISOString(),
  };
}

function rowToCampaign(
  row: CampaignRow,
  hexes: Record<string, Hex>,
  regions: Region[]
): Campaign {
  return {
    id: row.id,
    name: row.name,
    gridWidth: row.grid_width,
    gridHeight: row.grid_height,
    hexes,
    terrainTypes: row.terrain_types as Campaign['terrainTypes'],
    encounterTables: row.encounter_tables as Campaign['encounterTables'],
    createdAt: row.created_at,
    modifiedAt: row.modified_at,
    schemaVersion: row.schema_version,
    version: row.version,
    lastModifiedBy: row.last_modified_by ?? undefined,
    timeWeather: row.time_weather as Campaign['timeWeather'],
    markerTypes: row.marker_types as Campaign['markerTypes'],
    encounterTemplates: row.encounter_templates as Campaign['encounterTemplates'],
    bookmarkedHexes: row.bookmarked_hexes as Campaign['bookmarkedHexes'],
    regions,
    generationConfig: row.generation_config as Campaign['generationConfig'],
    landmarkTables: row.landmark_tables as Campaign['landmarkTables'],
    factions: row.factions as Campaign['factions'],
    sessions: row.sessions as Campaign['sessions'],
    sessionLog: row.session_log as Campaign['sessionLog'],
  };
}

// ============ CRUD FUNCTIONS ============

/**
 * List all campaigns the user owns or is a member of.
 */
export async function listCloudCampaigns(
  client: SupabaseClient,
  userId: string
): Promise<{ campaigns: CampaignRow[]; error?: string }> {
  // Fetch campaigns the user owns
  const { data: owned, error: ownedErr } = await client
    .from('campaigns')
    .select('*')
    .eq('owner_id', userId)
    .order('modified_at', { ascending: false });

  if (ownedErr) {
    return { campaigns: [], error: ownedErr.message };
  }

  // Fetch campaigns the user is a member of (but doesn't own)
  const { data: memberships, error: memberErr } = await client
    .from('campaign_members')
    .select('campaign_id')
    .eq('user_id', userId);

  if (memberErr) {
    return { campaigns: owned ?? [], error: memberErr.message };
  }

  const memberCampaignIds = (memberships ?? [])
    .map(m => m.campaign_id)
    .filter(id => !(owned ?? []).some(c => c.id === id));

  if (memberCampaignIds.length === 0) {
    return { campaigns: owned ?? [] };
  }

  const { data: shared, error: sharedErr } = await client
    .from('campaigns')
    .select('*')
    .in('id', memberCampaignIds)
    .order('modified_at', { ascending: false });

  if (sharedErr) {
    return { campaigns: owned ?? [], error: sharedErr.message };
  }

  return { campaigns: [...(owned ?? []), ...(shared ?? [])] };
}

/**
 * Load a full campaign (row + hexes + regions) and reconstruct a Campaign object.
 */
export async function loadCloudCampaign(
  client: SupabaseClient,
  campaignId: string
): Promise<{ campaign: Campaign | null; error?: string }> {
  // Load campaign row
  const { data: row, error: rowErr } = await client
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (rowErr || !row) {
    return { campaign: null, error: rowErr?.message ?? 'Campaign not found' };
  }

  // Load all hexes for this campaign
  const { data: hexRows, error: hexErr } = await client
    .from('hexes')
    .select('*')
    .eq('campaign_id', campaignId);

  if (hexErr) {
    return { campaign: null, error: hexErr.message };
  }

  // Build hex record from rows
  const hexes: Record<string, Hex> = {};
  for (const hexRow of (hexRows ?? [])) {
    hexes[hexRow.hex_key] = hexRow.data as Hex;
  }

  // Load all regions for this campaign
  const { data: regionRows, error: regionErr } = await client
    .from('regions')
    .select('*')
    .eq('campaign_id', campaignId);

  if (regionErr) {
    return { campaign: null, error: regionErr.message };
  }

  const regions: Region[] = (regionRows ?? []).map(r => r.data as Region);

  const campaign = rowToCampaign(row as CampaignRow, hexes, regions);
  return { campaign };
}

/**
 * Save (upsert) an entire campaign: campaign row, hexes, and regions.
 * Increments the version field for conflict detection.
 */
export async function saveCloudCampaign(
  client: SupabaseClient,
  campaign: Campaign,
  userId: string
): Promise<{ error?: string }> {
  // Upsert campaign row
  const row = campaignToRow(campaign, userId);
  const { error: campaignErr } = await client
    .from('campaigns')
    .upsert(row, { onConflict: 'id' });

  if (campaignErr) {
    return { error: campaignErr.message };
  }

  // Upsert hexes — batch all hex rows in a single upsert
  const hexRows: Array<Omit<HexRow, 'id'>> = Object.entries(campaign.hexes).map(
    ([hexKey, hex]) => ({
      campaign_id: campaign.id,
      hex_key: hexKey,
      data: hex,
      version: row.version,
      modified_at: row.modified_at,
    })
  );

  if (hexRows.length > 0) {
    const { error: hexErr } = await client
      .from('hexes')
      .upsert(hexRows, { onConflict: 'campaign_id,hex_key' });

    if (hexErr) {
      return { error: hexErr.message };
    }
  }

  // Upsert regions
  const regionRows: Array<Omit<RegionRow, 'id'>> = (campaign.regions ?? []).map(region => ({
    campaign_id: campaign.id,
    data: region,
    version: row.version,
    modified_at: row.modified_at,
  }));

  // Delete existing regions and re-insert (simpler than upserting individual regions
  // since regions don't have a stable unique constraint beyond campaign_id + region.id)
  if (campaign.regions && campaign.regions.length >= 0) {
    const { error: delErr } = await client
      .from('regions')
      .delete()
      .eq('campaign_id', campaign.id);

    if (delErr) {
      return { error: delErr.message };
    }

    if (regionRows.length > 0) {
      const { error: regionErr } = await client
        .from('regions')
        .insert(regionRows);

      if (regionErr) {
        return { error: regionErr.message };
      }
    }
  }

  return {};
}

/**
 * Delete a campaign (cascade handles hexes/regions via Supabase FK rules).
 */
export async function deleteCloudCampaign(
  client: SupabaseClient,
  campaignId: string
): Promise<{ error?: string }> {
  const { error } = await client
    .from('campaigns')
    .delete()
    .eq('id', campaignId);

  return error ? { error: error.message } : {};
}

/**
 * Upsert a single hex row (for incremental sync).
 */
export async function upsertHex(
  client: SupabaseClient,
  campaignId: string,
  hexKey: string,
  hexData: Hex,
  version: number
): Promise<{ error?: string }> {
  const { error } = await client
    .from('hexes')
    .upsert(
      {
        campaign_id: campaignId,
        hex_key: hexKey,
        data: hexData,
        version,
        modified_at: new Date().toISOString(),
      },
      { onConflict: 'campaign_id,hex_key' }
    );

  return error ? { error: error.message } : {};
}

// ============ REALTIME SUBSCRIPTIONS ============

export type HexChangePayload = {
  hexKey: string;
  data: Hex;
  version: number;
};

export type CampaignChangePayload = {
  campaignId: string;
  version: number;
};

/**
 * Subscribe to Realtime changes on hexes and campaigns tables
 * filtered by campaign_id. Returns an unsubscribe function.
 */
export function subscribeToChanges(
  client: SupabaseClient,
  campaignId: string,
  onHexChange: (payload: HexChangePayload) => void,
  onCampaignChange: (payload: CampaignChangePayload) => void
): () => void {
  const channel: RealtimeChannel = client
    .channel(`campaign:${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'hexes',
        filter: `campaign_id=eq.${campaignId}`,
      },
      (payload) => {
        const row = payload.new as HexRow | undefined;
        if (row) {
          onHexChange({
            hexKey: row.hex_key,
            data: row.data as Hex,
            version: row.version,
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'campaigns',
        filter: `id=eq.${campaignId}`,
      },
      (payload) => {
        const row = payload.new as CampaignRow | undefined;
        if (row) {
          onCampaignChange({
            campaignId: row.id,
            version: row.version,
          });
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    client.removeChannel(channel);
  };
}
