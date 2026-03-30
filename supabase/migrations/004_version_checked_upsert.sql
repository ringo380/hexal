-- 004_version_checked_upsert.sql
-- Atomic version-checked campaign upsert for optimistic concurrency control.
-- Prevents last-write-wins by comparing the client's expected version against
-- the server's current version before allowing the write.

-- ============================================================================
-- UPSERT CAMPAIGN WITH VERSION CHECK
-- ============================================================================

-- Accepts the full campaign payload plus an expected_version.
-- If the row doesn't exist, inserts it with version = 1.
-- If the row exists and current version != expected_version, returns conflict.
-- If versions match, updates the row and increments version.
-- Returns JSON: { conflict: bool, new_version?: int, server_version?: int }
CREATE OR REPLACE FUNCTION public.upsert_campaign_versioned(
  p_id                uuid,
  p_owner_id          uuid,
  p_name              text,
  p_grid_width        int,
  p_grid_height       int,
  p_terrain_types     jsonb,
  p_encounter_tables  jsonb,
  p_time_weather      jsonb,
  p_marker_types      jsonb,
  p_encounter_templates jsonb,
  p_bookmarked_hexes  jsonb,
  p_generation_config jsonb,
  p_landmark_tables   jsonb,
  p_factions          jsonb,
  p_sessions          jsonb,
  p_session_log       jsonb,
  p_schema_version    int,
  p_expected_version  int,
  p_last_modified_by  uuid,
  p_hex_rows          jsonb DEFAULT '[]',
  p_region_rows       jsonb DEFAULT '[]'
)
RETURNS jsonb AS $$
DECLARE
  v_current_version int;
  v_new_version     int;
  v_user_id         uuid;
  v_hex             jsonb;
  v_region          jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Lock the campaign row (or detect absence)
  SELECT version INTO v_current_version
  FROM public.campaigns
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- New campaign — insert with version 1
    INSERT INTO public.campaigns (
      id, owner_id, name, grid_width, grid_height,
      terrain_types, encounter_tables, time_weather, marker_types,
      encounter_templates, bookmarked_hexes, generation_config,
      landmark_tables, factions, sessions, session_log,
      schema_version, version, last_modified_by
    ) VALUES (
      p_id, p_owner_id, p_name, p_grid_width, p_grid_height,
      p_terrain_types, p_encounter_tables, p_time_weather, p_marker_types,
      p_encounter_templates, p_bookmarked_hexes, p_generation_config,
      p_landmark_tables, p_factions, p_sessions, p_session_log,
      p_schema_version, 1, p_last_modified_by
    );

    -- Insert hexes
    FOR v_hex IN SELECT * FROM jsonb_array_elements(p_hex_rows)
    LOOP
      INSERT INTO public.hexes (campaign_id, hex_key, data, version)
      VALUES (p_id, v_hex->>'hex_key', v_hex->'data', 1)
      ON CONFLICT (campaign_id, hex_key) DO UPDATE
        SET data = EXCLUDED.data, version = 1;
    END LOOP;

    -- Insert regions
    FOR v_region IN SELECT * FROM jsonb_array_elements(p_region_rows)
    LOOP
      INSERT INTO public.regions (campaign_id, name, color, description, hex_keys, tags, is_discovered, notes)
      VALUES (
        p_id,
        COALESCE(v_region->>'name', ''),
        COALESCE(v_region->>'color', '#888888'),
        COALESCE(v_region->>'description', ''),
        COALESCE(v_region->'hexKeys', '[]'),
        COALESCE(v_region->'tags', '[]'),
        COALESCE((v_region->>'isDiscovered')::boolean, false),
        COALESCE(v_region->>'notes', '')
      );
    END LOOP;

    RETURN jsonb_build_object('conflict', false, 'new_version', 1);
  END IF;

  -- Row exists — check version
  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'conflict', true,
      'server_version', v_current_version
    );
  END IF;

  -- Version matches — update
  v_new_version := v_current_version + 1;

  UPDATE public.campaigns SET
    name = p_name,
    grid_width = p_grid_width,
    grid_height = p_grid_height,
    terrain_types = p_terrain_types,
    encounter_tables = p_encounter_tables,
    time_weather = p_time_weather,
    marker_types = p_marker_types,
    encounter_templates = p_encounter_templates,
    bookmarked_hexes = p_bookmarked_hexes,
    generation_config = p_generation_config,
    landmark_tables = p_landmark_tables,
    factions = p_factions,
    sessions = p_sessions,
    session_log = p_session_log,
    schema_version = p_schema_version,
    version = v_new_version,
    last_modified_by = p_last_modified_by
  WHERE id = p_id;

  -- Upsert hexes
  FOR v_hex IN SELECT * FROM jsonb_array_elements(p_hex_rows)
  LOOP
    INSERT INTO public.hexes (campaign_id, hex_key, data, version)
    VALUES (p_id, v_hex->>'hex_key', v_hex->'data', v_new_version)
    ON CONFLICT (campaign_id, hex_key) DO UPDATE
      SET data = EXCLUDED.data, version = v_new_version;
  END LOOP;

  -- Replace regions: delete existing, insert new
  DELETE FROM public.regions WHERE campaign_id = p_id;

  FOR v_region IN SELECT * FROM jsonb_array_elements(p_region_rows)
  LOOP
    INSERT INTO public.regions (campaign_id, name, color, description, hex_keys, tags, is_discovered, notes)
    VALUES (
      p_id,
      COALESCE(v_region->>'name', ''),
      COALESCE(v_region->>'color', '#888888'),
      COALESCE(v_region->>'description', ''),
      COALESCE(v_region->'hexKeys', '[]'),
      COALESCE(v_region->'tags', '[]'),
      COALESCE((v_region->>'isDiscovered')::boolean, false),
      COALESCE(v_region->>'notes', '')
    );
  END LOOP;

  RETURN jsonb_build_object('conflict', false, 'new_version', v_new_version);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
