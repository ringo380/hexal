-- 002_rls_policies.sql
-- Row-Level Security policies for Hexal multi-user access control.
-- Implements fog-of-war for players (undiscovered hexes/regions hidden).

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Returns the user's role in a campaign, or NULL if not a member.
-- Used by all policies to avoid duplicating the membership lookup.
CREATE OR REPLACE FUNCTION public.get_campaign_role(campaign_uuid uuid, user_uuid uuid)
RETURNS text AS $$
  SELECT role FROM public.campaign_members
  WHERE campaign_id = campaign_uuid AND user_id = user_uuid
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES
-- ============================================================================

-- Any authenticated user can read any profile (needed for display names in UI)
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================

-- SELECT: user is the owner OR is a campaign_member
CREATE POLICY campaigns_select ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaign_members
      WHERE campaign_id = id AND user_id = auth.uid()
    )
  );

-- INSERT: any authenticated user can create a campaign (they become the owner)
CREATE POLICY campaigns_insert ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: owner or DM role
CREATE POLICY campaigns_update ON public.campaigns
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.get_campaign_role(id, auth.uid()) = 'dm'
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.get_campaign_role(id, auth.uid()) = 'dm'
  );

-- DELETE: only the campaign owner
CREATE POLICY campaigns_delete ON public.campaigns
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- HEXES
-- ============================================================================

-- SELECT for owners/DMs: all hexes in their campaigns
CREATE POLICY hexes_select_dm ON public.hexes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- SELECT for players/viewers: only hexes that are not undiscovered (fog of war)
CREATE POLICY hexes_select_player ON public.hexes
  FOR SELECT TO authenticated
  USING (
    public.get_campaign_role(campaign_id, auth.uid()) IN ('player', 'viewer')
    AND data->>'status' != 'undiscovered'
  );

-- INSERT: owner or DM
CREATE POLICY hexes_insert ON public.hexes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- UPDATE: owner or DM
CREATE POLICY hexes_update ON public.hexes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- DELETE: owner or DM
CREATE POLICY hexes_delete ON public.hexes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- ============================================================================
-- REGIONS
-- ============================================================================

-- SELECT for owners/DMs: all regions
CREATE POLICY regions_select_dm ON public.regions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- SELECT for players/viewers: only discovered regions
CREATE POLICY regions_select_player ON public.regions
  FOR SELECT TO authenticated
  USING (
    public.get_campaign_role(campaign_id, auth.uid()) IN ('player', 'viewer')
    AND is_discovered = true
  );

-- INSERT: owner or DM
CREATE POLICY regions_insert ON public.regions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- UPDATE: owner or DM
CREATE POLICY regions_update ON public.regions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- DELETE: owner or DM
CREATE POLICY regions_delete ON public.regions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- ============================================================================
-- CAMPAIGN_MEMBERS
-- ============================================================================

-- SELECT: any member of the campaign can see the membership list
CREATE POLICY campaign_members_select ON public.campaign_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.campaign_id = campaign_id AND cm.user_id = auth.uid()
    )
  );

-- INSERT: only the campaign owner can add members
CREATE POLICY campaign_members_insert ON public.campaign_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
  );

-- DELETE: only the campaign owner can remove members
CREATE POLICY campaign_members_delete ON public.campaign_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- INVITE_LINKS
-- ============================================================================

-- SELECT: campaign owner or DM
CREATE POLICY invite_links_select ON public.invite_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
    OR public.get_campaign_role(campaign_id, auth.uid()) = 'dm'
  );

-- INSERT: only campaign owner
CREATE POLICY invite_links_insert ON public.invite_links
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
  );

-- DELETE: only campaign owner
CREATE POLICY invite_links_delete ON public.invite_links
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.owner_id = auth.uid()
    )
  );
