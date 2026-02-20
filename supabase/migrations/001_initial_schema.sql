-- 001_initial_schema.sql
-- Hexal cloud schema: profiles, campaigns, hexes, regions, campaign_members, invite_links
-- Designed to mirror the local Campaign/Hex/Region TypeScript types with relational normalization.

-- ============================================================================
-- TABLES
-- ============================================================================

-- User profiles, auto-created on auth.users signup
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  avatar_url  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Campaign metadata (everything except hexes and regions, which are normalized out)
CREATE TABLE public.campaigns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  name              text NOT NULL,
  grid_width        int NOT NULL,
  grid_height       int NOT NULL,

  -- JSONB columns for complex nested data that doesn't need relational queries
  terrain_types       jsonb DEFAULT '[]',
  encounter_tables    jsonb DEFAULT '[]',
  time_weather        jsonb,
  marker_types        jsonb,
  encounter_templates jsonb DEFAULT '[]',
  bookmarked_hexes    jsonb DEFAULT '[]',
  generation_config   jsonb,
  landmark_tables     jsonb DEFAULT '[]',
  factions            jsonb DEFAULT '[]',
  sessions            jsonb DEFAULT '[]',
  session_log         jsonb DEFAULT '[]',

  -- Versioning
  schema_version    int DEFAULT 2,
  version           int DEFAULT 1,
  last_modified_by  uuid REFERENCES public.profiles,

  -- Timestamps
  created_at        timestamptz DEFAULT now(),
  modified_at       timestamptz DEFAULT now()
);

-- Individual hex cells, normalized out of campaign for granular sync and RLS fog-of-war
CREATE TABLE public.hexes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns ON DELETE CASCADE,
  hex_key       text NOT NULL,         -- "q,r" axial coordinate string
  data          jsonb NOT NULL,        -- Full Hex object (terrain, status, notes, content arrays, etc.)
  version       int DEFAULT 1,
  modified_at   timestamptz DEFAULT now(),

  UNIQUE (campaign_id, hex_key)
);

-- Named geographic regions (normalized from campaign.regions[] for per-row RLS)
CREATE TABLE public.regions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns ON DELETE CASCADE,
  name          text NOT NULL,
  color         text NOT NULL,         -- Hex color e.g. "#4a9eff"
  description   text DEFAULT '',
  hex_keys      jsonb DEFAULT '[]',    -- Array of "q,r" strings
  tags          jsonb DEFAULT '[]',
  is_discovered boolean DEFAULT false,
  notes         text DEFAULT '',

  created_at    timestamptz DEFAULT now(),
  modified_at   timestamptz DEFAULT now()
);

-- Campaign membership / access control
CREATE TABLE public.campaign_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('owner', 'dm', 'player', 'viewer')),
  joined_at     timestamptz DEFAULT now(),

  UNIQUE (campaign_id, user_id)
);

-- Shareable invite links for joining a campaign
CREATE TABLE public.invite_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns ON DELETE CASCADE,
  token         text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  role          text NOT NULL CHECK (role IN ('dm', 'player', 'viewer')),
  created_by    uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  expires_at    timestamptz,
  max_uses      int,
  use_count     int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_hexes_campaign_key ON public.hexes (campaign_id, hex_key);
CREATE INDEX idx_campaign_members_campaign ON public.campaign_members (campaign_id);
CREATE INDEX idx_campaign_members_user ON public.campaign_members (user_id);
CREATE INDEX idx_invite_links_token ON public.invite_links (token);
CREATE INDEX idx_invite_links_campaign ON public.invite_links (campaign_id);

-- ============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- AUTO-UPDATE modified_at TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_modified_at()
RETURNS trigger AS $$
BEGIN
  NEW.modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_at();

CREATE TRIGGER hexes_updated_at
  BEFORE UPDATE ON public.hexes
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_at();

CREATE TRIGGER regions_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_at();
