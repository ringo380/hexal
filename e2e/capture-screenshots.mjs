/**
 * Hexal documentation screenshot capture script.
 *
 * Loads a pre-built showcase campaign fixture and captures 13
 * documentation-quality screenshots of all major features.
 *
 * Prerequisites:
 *   - Vite dev server running: npm run dev
 *   - Compiled Electron files in dist-electron/
 *
 * Run: npm run screenshots
 */
import { _electron as electron } from 'playwright';
import { copyFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ── Paths ──────────────────────────────────────────────────────────
const FIXTURE_SRC  = join(import.meta.dirname, 'fixtures', 'showcase-campaign.hexal');
const HEXAL_DIR    = join(homedir(), 'Documents', 'Hexal');
const FIXTURE_DEST = join(HEXAL_DIR, 'The Sundered Reaches.hexal');
const SCREENSHOTS  = join(import.meta.dirname, '..', 'docs', 'screenshots');

// ── Helpers (reused from smoke.mjs) ────────────────────────────────

/** Launch the Electron app and return the main window. */
async function launchApp() {
  const electronApp = await electron.launch({
    args: ['./dist-electron/main.js'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: 'http://localhost:5173/',
    },
  });

  let window = await electronApp.firstWindow();
  await window.waitForTimeout(2000);

  // Find the correct window (skip DevTools)
  for (const w of electronApp.windows()) {
    const t = await w.title();
    if (t.includes('Hexal') || t === '') {
      window = w;
      break;
    }
  }

  await window.setViewportSize({ width: 1600, height: 1000 });
  await window.waitForLoadState('networkidle');
  await window.waitForTimeout(3000);

  return { electronApp, window };
}

/** Click the center of the canvas element. */
async function clickCanvasCenter(window) {
  const canvas = window.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) return null;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await window.mouse.click(cx, cy);
  await window.waitForTimeout(500);
  return { x: cx, y: cy };
}

/** Click at an offset from canvas center. */
async function clickCanvasOffset(window, dx, dy) {
  const canvas = window.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) return null;
  const x = box.x + box.width / 2 + dx;
  const y = box.y + box.height / 2 + dy;
  await window.mouse.click(x, y);
  await window.waitForTimeout(500);
  return { x, y };
}

/** Dismiss any open modal overlay. */
async function dismissModals(window) {
  const overlay = window.locator('.modal-overlay');
  if (await overlay.count() > 0) {
    await window.keyboard.press('Escape');
    await window.waitForTimeout(400);
    if (await overlay.count() > 0) {
      await window.mouse.click(5, 5);
      await window.waitForTimeout(400);
    }
  }
}

/** Take a screenshot and save to docs/screenshots/. */
async function capture(window, name) {
  const path = join(SCREENSHOTS, name);
  await window.screenshot({ path });
  console.log(`  captured: ${name}`);
}

// ── Screenshot sequence ────────────────────────────────────────────

async function main() {
  // Ensure output directory exists
  mkdirSync(SCREENSHOTS, { recursive: true });

  // Copy fixture to ~/Documents/Hexal/ so the app can find it
  mkdirSync(HEXAL_DIR, { recursive: true });
  const fixtureExisted = existsSync(FIXTURE_DEST);
  copyFileSync(FIXTURE_SRC, FIXTURE_DEST);
  console.log('Copied showcase fixture to', FIXTURE_DEST);

  let electronApp, window;
  try {
    console.log('Launching Hexal...');
    ({ electronApp, window } = await launchApp());

    // ── 1. Campaign Browser ────────────────────────────────────────
    console.log('\n1/13 Campaign Browser');
    await capture(window, 'campaign-browser.png');

    // ── Open the showcase campaign ─────────────────────────────────
    // Find the campaign card and double-click it
    const campaignCard = window.locator('.campaign-card, [class*="campaign-card"], .campaign-item, [class*="campaign-item"]').filter({ hasText: 'Sundered Reaches' });
    if (await campaignCard.count() > 0) {
      await campaignCard.first().dblclick();
    } else {
      // Fallback: click first card then Open button
      const firstCard = window.locator('.campaign-card, [class*="campaign-card"], .campaign-item').first();
      if (await firstCard.count() > 0) {
        await firstCard.click();
        await window.waitForTimeout(300);
        const openBtn = window.locator('button:has-text("Open")').first();
        if (await openBtn.count() > 0) {
          await openBtn.click();
        }
      }
    }
    await window.waitForTimeout(3000);

    // Verify campaign loaded (canvas present)
    const canvas = window.locator('canvas');
    if (await canvas.count() === 0) {
      throw new Error('Campaign did not load — no canvas element found');
    }

    // ── 2. Hex Grid Overview ───────────────────────────────────────
    console.log('2/13 Hex Grid Overview');
    // Select a populated hex (click near center of grid)
    await clickCanvasCenter(window);
    await window.waitForTimeout(500);
    await capture(window, 'hex-grid-overview.png');

    // ── 3. Hex Detail Panel ────────────────────────────────────────
    console.log('3/13 Hex Detail Panel');
    // The overview shot already shows the detail panel with a selected hex
    // Try clicking at a slightly different position to select a content-rich hex
    await clickCanvasOffset(window, -200, 0);
    await window.waitForTimeout(500);
    await capture(window, 'hex-detail-panel.png');

    // ── 4. Encounter Editor ────────────────────────────────────────
    console.log('4/13 Encounter Editor');
    // Try to find and expand an encounter in the detail panel
    const encounterRow = window.locator('.content-item-row:has-text("Encounter"), [class*="encounter-row"], [class*="content-row"]').filter({ hasText: /Wolf|Goblin|Orc|Merchant|Bar Fight|Guardian|Temple|Ambush/i }).first();
    if (await encounterRow.count() > 0) {
      await encounterRow.click();
      await window.waitForTimeout(800);
    }
    await capture(window, 'encounter-editor.png');
    await dismissModals(window);

    // ── 5. NPC Directory ───────────────────────────────────────────
    console.log('5/13 NPC Directory');
    // Open via toolbar — look for NPC-related button or use keyboard shortcut
    const npcBtn = window.locator('button:has-text("NPCs"), button:has-text("NPC Directory")');
    if (await npcBtn.count() > 0) {
      await npcBtn.first().click();
      await window.waitForTimeout(1000);
    } else {
      // Try keyboard shortcut
      await window.keyboard.press('Meta+n');
      await window.waitForTimeout(1000);
    }
    await capture(window, 'npc-system.png');
    await dismissModals(window);

    // ── 6. Procedural Generation Modal ─────────────────────────────
    console.log('6/13 Procedural Generation');
    const generateBtn = window.locator('button:has-text("Generate")');
    if (await generateBtn.count() > 0) {
      await generateBtn.first().click();
      await window.waitForTimeout(1000);
    }
    await capture(window, 'procedural-generation.png');
    await dismissModals(window);

    // ── 7. Region Manager ──────────────────────────────────────────
    console.log('7/13 Regions');
    const regionsBtn = window.locator('button:has-text("Regions")');
    if (await regionsBtn.count() > 0) {
      await regionsBtn.first().click();
      await window.waitForTimeout(1000);
    }
    await capture(window, 'regions.png');
    await dismissModals(window);

    // ── 8. Time Controls ───────────────────────────────────────────
    console.log('8/13 Time & Weather');
    // Click the time/weather bar to open controls
    const timeBar = window.locator('.time-weather-bar, [class*="time-weather"]');
    if (await timeBar.count() > 0) {
      await timeBar.first().click();
      await window.waitForTimeout(1000);
    }
    await capture(window, 'time-weather.png');
    await dismissModals(window);

    // ── 9. Player View ─────────────────────────────────────────────
    console.log('9/13 Player View');
    // Open player view via toolbar or keyboard
    const playerViewBtn = window.locator('button:has-text("Player View"), button:has-text("Player")');
    if (await playerViewBtn.count() > 0) {
      await playerViewBtn.first().click();
      await window.waitForTimeout(2000);

      // Try to find and capture the player view window
      const allWindows = electronApp.windows();
      for (const w of allWindows) {
        const url = w.url();
        if (url.includes('player-view') || url.includes('#player-view')) {
          await w.setViewportSize({ width: 1600, height: 1000 });
          await w.waitForTimeout(1000);
          await w.screenshot({ path: join(SCREENSHOTS, 'player-view.png') });
          console.log('  captured: player-view.png');
          await w.close();
          break;
        }
      }
    }
    // If no separate window was captured, capture current state
    if (!existsSync(join(SCREENSHOTS, 'player-view.png'))) {
      await capture(window, 'player-view.png');
    }
    await window.waitForTimeout(500);

    // ── 10. Map Export ─────────────────────────────────────────────
    console.log('10/13 Map Export');
    await dismissModals(window);
    const exportMapBtn = window.locator('button:has-text("Export Map")');
    if (await exportMapBtn.count() > 0) {
      await exportMapBtn.first().click();
      await window.waitForTimeout(1000);
    }
    await capture(window, 'map-export.png');
    await dismissModals(window);

    // ── 11. Command Palette ────────────────────────────────────────
    console.log('11/13 Command Palette');
    await window.keyboard.press('Meta+k');
    await window.waitForTimeout(600);
    await capture(window, 'command-palette.png');
    await window.keyboard.press('Escape');
    await window.waitForTimeout(300);

    // ── 12. Session Log ────────────────────────────────────────────
    console.log('12/13 Session Log');
    const sessionBtn = window.locator('button:has-text("Sessions"), button:has-text("Session Log"), button:has-text("Log")');
    if (await sessionBtn.count() > 0) {
      await sessionBtn.first().click();
      await window.waitForTimeout(1000);
    }
    await capture(window, 'session-log.png');
    await dismissModals(window);

    // ── 13. Terrain Editor ─────────────────────────────────────────
    console.log('13/13 Terrain Editor');
    const terrainEditorBtn = window.locator('button:has-text("Terrain")').filter({ hasText: /Terrain/i });
    // The terrain editor might be under a "Terrain" button or in settings
    // Try the "Tables" menu which may contain terrain editor
    if (await terrainEditorBtn.count() > 0) {
      await terrainEditorBtn.first().click();
      await window.waitForTimeout(1000);
    } else {
      // Try keyboard shortcut or alternative path
      const tablesBtn = window.locator('button:has-text("Tables")');
      if (await tablesBtn.count() > 0) {
        await tablesBtn.first().click();
        await window.waitForTimeout(1000);
      }
    }
    await capture(window, 'terrain-editor.png');
    await dismissModals(window);

    console.log('\nAll screenshots captured successfully!');

  } catch (err) {
    console.error(`\nERROR: ${err.message}`);
    if (window) {
      await window.screenshot({ path: join(SCREENSHOTS, 'error.png') }).catch(() => {});
    }
    process.exitCode = 1;
  } finally {
    // Clean up fixture copy if we created it
    if (!fixtureExisted && existsSync(FIXTURE_DEST)) {
      try {
        unlinkSync(FIXTURE_DEST);
        console.log('Cleaned up fixture copy');
      } catch { /* ignore */ }
    }
    if (electronApp) {
      await electronApp.close();
    }
  }

  // Report
  const { readdirSync } = await import('fs');
  const files = readdirSync(SCREENSHOTS).filter(f => f.endsWith('.png'));
  console.log(`\nGenerated ${files.length} screenshot(s) in docs/screenshots/:`);
  files.forEach(f => console.log(`  ${f}`));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
