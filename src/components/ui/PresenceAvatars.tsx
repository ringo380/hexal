// PresenceAvatars — Real-time presence indicator for connected collaborators.
//
// This component will show colored avatar dots for each user currently viewing
// or editing the campaign, powered by Supabase Realtime Presence. Each user's
// cursor position on the hex grid can also be broadcast and rendered here.
//
// Implementation plan:
// 1. Subscribe to a Supabase Realtime channel scoped to the campaignId
// 2. Track presence state (user id, display name, avatar color, cursor hex)
// 3. Render a row of small colored circles with initials for each connected user
//
// For now, this renders nothing until the Realtime Presence integration is complete.

interface PresenceAvatarsProps {
  campaignId: string;
}

function PresenceAvatars({ campaignId: _campaignId }: PresenceAvatarsProps) {
  // Presence subscription and rendering will be added when the Realtime
  // adapter is wired into the sync engine.
  return null;
}

export default PresenceAvatars;
