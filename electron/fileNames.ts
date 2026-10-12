// Characters Windows rejects in file names, plus ASCII control characters.
const WINDOWS_ILLEGAL = /[<>:"/\\|?*\u0000-\u001f]/g;
// Device names Windows reserves regardless of extension ("CON.hexal" is still CON).
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/**
 * Turn a user-supplied name (e.g. a campaign name) into a safe file base name.
 *
 * On Windows this strips every character the filesystem rejects. A ":" in
 * particular does not fail loudly on NTFS: "Act 1: Keep.hexal" is read as an
 * alternate data stream of a file named "Act 1". Other platforms keep the
 * original separator-only rule so existing autosave files keep their names.
 */
export function toSafeFileName(name: string, platform: string = process.platform): string {
  if (platform !== 'win32') {
    return name.replace(/[/\\]/g, '-');
  }
  // Trailing dots and spaces are left alone: callers append an extension, and
  // trimming them would make "Campaign " and "Campaign" share one file.
  let safe = name.replace(WINDOWS_ILLEGAL, '-');
  // Windows matches reserved names up to the first dot, so suffix that part
  // ("aux.v2" -> "aux_.v2"), not the end of the string.
  const dot = safe.indexOf('.');
  const stem = dot === -1 ? safe : safe.slice(0, dot);
  if (WINDOWS_RESERVED.test(stem)) {
    safe = `${stem}_${safe.slice(stem.length)}`;
  }
  return safe || 'Untitled';
}
