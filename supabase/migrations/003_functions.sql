-- 003_functions.sql
-- RPC functions for invite acceptance and server-side player view filtering.

-- ============================================================================
-- ACCEPT INVITE
-- ============================================================================

-- Validates an invite token, checks expiry and max uses, inserts the caller
-- as a campaign_member with the invite's role, and increments use_count.
-- Returns the campaign_id on success.
CREATE OR REPLACE FUNCTION public.accept_invite(invite_token text)
RETURNS uuid AS $$
DECLARE
  v_invite    record;
  v_campaign_id uuid;
  v_user_id   uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Fetch the invite (bypass RLS since we're looking up by public token)
  SELECT * INTO v_invite
  FROM public.invite_links
  WHERE token = invite_token;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;

  -- Check expiry
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite link has expired';
  END IF;

  -- Check max uses
  IF v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN
    RAISE EXCEPTION 'Invite link has reached its maximum number of uses';
  END IF;

  v_campaign_id := v_invite.campaign_id;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = v_campaign_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this campaign';
  END IF;

  -- Insert the new member
  INSERT INTO public.campaign_members (campaign_id, user_id, role)
  VALUES (v_campaign_id, v_user_id, v_invite.role);

  -- Increment use count
  UPDATE public.invite_links
  SET use_count = use_count + 1
  WHERE id = v_invite.id;

  RETURN v_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STRIP HEX FOR PLAYER
-- ============================================================================

-- Server-side equivalent of the client-side playerViewFilter.
-- Mirrors the logic in src/services/playerViewFilter.ts:
--   - Undiscovered hexes: keep only coordinate, terrain, status, connections
--   - Discovered/cleared hexes: add location titles and NPC names
--   - Always strip: notes, tags, encounter details, treasure details, clue details, descriptions
-- Accepts the full hex `data` jsonb and returns a filtered copy.
CREATE OR REPLACE FUNCTION public.strip_hex_for_player(hex_data jsonb)
RETURNS jsonb AS $$
DECLARE
  v_status    text;
  v_result    jsonb;
  v_locations jsonb;
  v_npcs      jsonb;
  v_loc       jsonb;
  v_npc       jsonb;
  v_loc_names jsonb := '[]'::jsonb;
  v_npc_names jsonb := '[]'::jsonb;
BEGIN
  v_status := hex_data->>'status';

  -- Base fields always included (enough for fog-of-war rendering)
  v_result := jsonb_build_object(
    'id',         hex_data->'id',
    'coordinate', hex_data->'coordinate',
    'terrain',    hex_data->'terrain',
    'status',     hex_data->'status'
  );

  -- Always include connections (rivers/roads are map features, not secrets)
  IF hex_data ? 'connections' THEN
    v_result := v_result || jsonb_build_object('connections', hex_data->'connections');
  END IF;

  -- For undiscovered hexes, return minimal data
  IF v_status = 'undiscovered' THEN
    RETURN v_result;
  END IF;

  -- For discovered/cleared: include visible markers
  IF hex_data ? 'markers' THEN
    v_result := v_result || jsonb_build_object(
      'markers',
      (
        SELECT COALESCE(jsonb_agg(m), '[]'::jsonb)
        FROM jsonb_array_elements(hex_data->'markers') AS m
        WHERE (m->>'isVisible')::boolean = true
      )
    );
  END IF;

  -- Extract location titles (names only, no descriptions/details)
  v_locations := COALESCE(hex_data->'locations', '[]'::jsonb);
  SELECT COALESCE(jsonb_agg(loc->>'title'), '[]'::jsonb)
  INTO v_loc_names
  FROM jsonb_array_elements(v_locations) AS loc
  WHERE loc->>'title' IS NOT NULL AND loc->>'title' != '';

  v_result := v_result || jsonb_build_object('locationNames', v_loc_names);

  -- Extract NPC names (name only, no detailed info)
  v_npcs := COALESCE(hex_data->'npcs', '[]'::jsonb);
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('name', npc->>'title')
    ),
    '[]'::jsonb
  )
  INTO v_npc_names
  FROM jsonb_array_elements(v_npcs) AS npc
  WHERE npc->>'title' IS NOT NULL AND npc->>'title' != '';

  v_result := v_result || jsonb_build_object('npcs', v_npc_names);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
