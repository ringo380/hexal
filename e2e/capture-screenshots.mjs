/**
 * Hexal documentation screenshot capture script.
 *
 * Loads a pre-built showcase campaign fixture and captures documentation
 * screenshots of the major features. Every shot first checks that the screen
 * it is meant to show is actually open; a shot whose check fails is reported
 * and NOT written, so a stale or wrong image never silently replaces a good one.
 *
 * Prerequisites:
 *   - Vite dev server running and settled: npm run dev
 *   - Compiled Electron files in dist-electron/
 *
 * Run: npm run screenshots            (all shots)
 *      npm run screenshots -- dice    (only shots whose name contains "dice")
 */
import { _electron as electron } from 'playwright';
import { copyFileSync, mkdirSync, existsSync, unlinkSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

/**
 * The Documents folder the app will use (Electron's app.getPath('documents')).
 * On Windows it is often redirected (e.g. into OneDrive), so ~/Documents is
 * wrong there; ask the same known-folder API Electron uses.
 */
function documentsDir() {
  if (process.platform === 'win32') {
    try {
      const out = execFileSync('powershell.exe', [
        '-NoProfile', '-Command', "[Environment]::GetFolderPath('MyDocuments')",
      ], { encoding: 'utf8' }).trim();
      if (out) return out;
    } catch (err) {
      console.warn('Could not query the Documents folder, falling back to ~/Documents:', err.message);
    }
  }
  return join(homedir(), 'Documents');
}

// ── Paths (use fileURLToPath for Node < 20.11 compat) ─────────────
const __dirname    = dirname(fileURLToPath(import.meta.url));
const FIXTURE_SRC  = join(__dirname, 'fixtures', 'showcase-campaign.hexal');
const HEXAL_DIR    = join(documentsDir(), 'Hexal');
const FIXTURE_DEST = join(HEXAL_DIR, 'The Sundered Reaches.hexal');
const BACKUP_DEST  = FIXTURE_DEST + '.bak';
const SCREENSHOTS  = join(__dirname, '..', 'docs', 'screenshots');

const VIEWPORT = { width: 1920, height: 1080 };
const ONLY = process.argv[2] || '';

// ── Helpers ───────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Launch the Electron app and return the main app window (never DevTools). */
async function launchApp() {
  const electronApp = await electron.launch({
    args: ['./dist-electron/main.js'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: 'http://localhost:5173/',
    },
  });
  await electronApp.firstWindow();

  let window;
  for (let i = 0; i < 60 && !window; i++) {
    window = electronApp.windows().find(w => w.url().startsWith('http://localhost'));
    if (!window) await sleep(250);
  }
  if (!window) throw new Error('App window did not open');

  await window.setViewportSize(VIEWPORT);
  await window.waitForLoadState('networkidle');
  await window.waitForTimeout(3000);
  return { electronApp, window };
}

/**
 * The toolbar is wider than most screens, and clicking a button near its end
 * scrolls the layout sideways. Undo that before capturing.
 */
async function resetScroll(window) {
  await window.evaluate(() => {
    document.querySelectorAll('*').forEach(el => {
      if (el.scrollLeft) el.scrollLeft = 0;
    });
    window.scrollTo(0, 0);
  });
}

/** Press Escape until no modal is open (or give up after a few tries). */
async function closeModals(window) {
  for (let i = 0; i < 3; i++) {
    if (await window.locator('.modal-overlay, .modal, .command-palette-overlay').count() === 0) return;
    await window.keyboard.press('Escape');
    await window.waitForTimeout(300);
  }
}

/** Click a toolbar button by its visible label. */
// Toolbar actions that live inside a grouped menu, keyed by item label
const TOOLBAR_MENU_OF = {
  Encounters: 'World', Landmarks: 'World', Templates: 'World',
  Regions: 'World', Terrain: 'World', Generate: 'World',
  NPCs: 'Story', Quests: 'Story', Sessions: 'Story', Characters: 'Story',
  'Player Notes': 'Players', 'Message Players': 'Players',
  'Export Map': 'Export', 'Export Data': 'Export',
};

/** Click a toolbar action, opening its group menu first when it has one. */
async function toolbar(window, label) {
  // The label may be followed by a count badge (e.g. "Player Notes 2")
  const exact = (text) => new RegExp(`^\\s*${text}\\s*\\d*\\s*$`);
  const group = TOOLBAR_MENU_OF[label];
  if (group) {
    await window.locator('.toolbar .toolbar-menu-trigger').filter({ hasText: exact(group) }).first().click();
    await window.locator('.toolbar [role="menuitem"]').filter({ hasText: exact(label) }).first().click();
  } else {
    await window.locator('.toolbar button').filter({ hasText: exact(label) }).first().click();
  }
  await window.waitForTimeout(800);
}

/** Select a hex through the sidebar hex list, e.g. selectHex(window, 1, 8). */
async function selectHex(window, q, r) {
  const row = window.locator('.hex-coord').filter({ hasText: `(${q}, ${r})` }).first();
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await window.waitForTimeout(600);
  await expectVisible(window, window.getByText(`Hex (${q}, ${r})`).first(), `detail panel for hex (${q}, ${r})`);
}

async function expectVisible(window, locator, what) {
  try {
    await locator.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    throw new Error(`expected ${what} to be visible`);
  }
}

const results = [];

/**
 * Run one shot: `setup` opens the screen and throws if it is not as expected.
 * The image is written only when setup succeeds.
 */
async function shot(window, name, setup, { page = window, clip } = {}) {
  if (ONLY && !name.includes(ONLY)) return;
  console.log(`- ${name}`);
  try {
    const target = (await setup()) || page;
    await resetScroll(target);
    await target.waitForTimeout(300);
    await target.screenshot({ path: join(SCREENSHOTS, name), clip });
    results.push({ name, ok: true });
    console.log('    captured');
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.log(`    FAILED: ${err.message}`);
  } finally {
    await closeModals(window).catch(() => {});
  }
}

// ── Screenshot sequence ────────────────────────────────────────────

async function main() {
  mkdirSync(SCREENSHOTS, { recursive: true });

  // Copy the fixture into the Documents\Hexal folder the app lists campaigns
  // from. Back up any existing file first to avoid data loss.
  mkdirSync(HEXAL_DIR, { recursive: true });
  const fixtureExisted = existsSync(FIXTURE_DEST);
  if (fixtureExisted) {
    renameSync(FIXTURE_DEST, BACKUP_DEST);
    console.log('Backed up existing campaign to', BACKUP_DEST);
  }
  copyFileSync(FIXTURE_SRC, FIXTURE_DEST);
  console.log('Copied showcase fixture to', FIXTURE_DEST);

  let electronApp, window;
  try {
    console.log('Launching Hexal...');
    ({ electronApp, window } = await launchApp());

    await shot(window, 'campaign-browser.png', async () => {
      await expectVisible(window, window.locator('.campaign-browser'), 'campaign browser');
    });

    // Open the showcase campaign
    await window.locator('.campaign-button').filter({ hasText: 'Sundered Reaches' }).first().click();
    await window.waitForTimeout(3000);
    await expectVisible(window, window.locator('canvas').first(), 'hex grid canvas');

    await shot(window, 'hex-grid-overview.png', async () => {
      await selectHex(window, 1, 8);
    });

    await shot(window, 'hex-detail-panel.png', async () => {
      await selectHex(window, 5, 4);
    });

    await shot(window, 'encounter-editor.png', async () => {
      await selectHex(window, 1, 8);
      await window.locator('.detail-panel').getByText('Bar Fight at the Salty Dog').first().click();
      await window.waitForTimeout(800);
      const editor = window.locator('.modal, .detail-panel input[type="text"], .detail-panel textarea');
      if (await editor.count() === 0) throw new Error('encounter editor did not open');
    });

    await shot(window, 'npc-system.png', async () => {
      await toolbar(window, 'NPCs');
      await expectVisible(window, window.getByText('NPC Directory').first(), 'NPC directory');
      await window.locator('.modal').getByText('Harbormaster Kael').first().click();
      await window.waitForTimeout(500);
    });

    await shot(window, 'quests.png', async () => {
      await toolbar(window, 'Quests');
      await expectVisible(window, window.getByText('Quests & Story Arcs').first(), 'quest manager');
      await window.locator('.modal').getByText('The Missing Fishermen').first().click();
      await window.waitForTimeout(500);
    });

    await shot(window, 'procedural-generation.png', async () => {
      await toolbar(window, 'Generate');
      await expectVisible(window, window.getByText('Generate Content').first(), 'generate dialog');
    });

    await shot(window, 'regions.png', async () => {
      await toolbar(window, 'Regions');
      await expectVisible(window, window.locator('.modal').getByText('The Greenwood').first(), 'region manager');
    });

    await shot(window, 'time-weather.png', async () => {
      // The simulation only runs once the radar is switched on in this session
      await window.getByRole('button', { name: 'Enable weather radar overlay' }).click();
      await expectVisible(window, window.locator('.weather-sim-status.running'), 'running weather simulation');
      await window.getByRole('button', { name: 'Toggle map layers' }).click();
      await window.waitForTimeout(300);
      for (const label of ['Weather Overlay', 'Isobars', 'Fronts', 'Cloud Cover', 'Wind Arrows']) {
        const box = window.locator('.layer-controls-item').filter({ hasText: label }).locator('input');
        if (!(await box.isChecked())) await box.check();
      }
      await window.getByRole('button', { name: 'Toggle map layers' }).click();
      await window.waitForTimeout(4000); // let the weather simulation draw
    });

    await shot(window, 'player-view.png', async () => {
      await electronApp.evaluate(({ Menu }) => {
        const view = Menu.getApplicationMenu().items.find(m => m.label === 'View');
        view.submenu.items.find(i => i.label === 'Open Player View').click();
      });
      let player;
      for (let i = 0; i < 40 && !player; i++) {
        player = electronApp.windows().find(w => w.url().includes('player-view'));
        if (!player) await sleep(250);
      }
      if (!player) throw new Error('player view window did not open');
      // Resize the real window (not viewport emulation) so the map canvas
      // gets the same resize events a user's window would
      await electronApp.evaluate(({ BrowserWindow }, size) => {
        const w = BrowserWindow.getAllWindows().find(b => b.webContents.getURL().includes('player-view'));
        w.setContentSize(size.width, size.height);
      }, VIEWPORT);
      await player.waitForTimeout(3000);
      await expectVisible(player, player.locator('canvas').first(), 'player map');
      return player;
    // The player map opens at its default zoom in the top-left corner, so crop
    // to the map instead of capturing a mostly empty window
    }, { clip: { x: 0, y: 0, width: 800, height: 560 } });
    for (const w of electronApp.windows()) {
      if (w.url().includes('player-view')) await w.close().catch(() => {});
    }

    await shot(window, 'map-export.png', async () => {
      await toolbar(window, 'Export Map');
      await expectVisible(window, window.locator('.modal').first(), 'map export dialog');
    });

    await shot(window, 'command-palette.png', async () => {
      await window.locator('canvas').first().click({ position: { x: 5, y: 5 } });
      await window.keyboard.press('ControlOrMeta+k');
      await window.waitForTimeout(400);
      await expectVisible(window, window.locator('.command-palette'), 'command palette');
      await window.keyboard.type('Storm');
      await window.waitForTimeout(400);
    });

    await shot(window, 'session-log.png', async () => {
      await toolbar(window, 'Sessions');
      await expectVisible(window, window.getByText('Session Log').first(), 'session log');
      await window.locator('.modal').getByText('Arrival at Stormhaven').first().click();
      await window.waitForTimeout(500);
    });

    await shot(window, 'terrain-editor.png', async () => {
      await toolbar(window, 'Terrain');
      await expectVisible(window, window.getByText('Terrain Types').first(), 'terrain editor');
    });

    await shot(window, 'combat-tracker.png', async () => {
      await selectHex(window, 1, 8);
      await toolbar(window, 'Combat');
      const panel = window.getByRole('region', { name: 'Combat tracker' }).or(window.locator('[aria-label="Combat tracker"]')).first();
      await expectVisible(window, panel, 'combat tracker');
      // Starting combat adds the party's characters automatically
      await panel.getByRole('button', { name: /Start Combat/ }).click();
      await window.waitForTimeout(400);
      const pick = panel.getByLabel('Select encounter to add');
      const option = await pick.locator('option').filter({ hasText: 'Bar Fight' }).first().getAttribute('value');
      await pick.selectOption(option);
      await pick.locator('xpath=..').getByRole('button').first().click();
      await window.waitForTimeout(500);
      await panel.getByRole('button', { name: 'Next turn' }).click();
      await window.waitForTimeout(500);
    });
    await window.locator('[aria-label="Close combat tracker"]').click().catch(() => {});

    await shot(window, 'dice-roller.png', async () => {
      await toolbar(window, 'Dice');
      const panel = window.locator('[aria-label="Dice roller"]').last();
      await expectVisible(window, panel, 'dice roller');
      await panel.getByRole('group', { name: 'Choose a die' }).getByRole('button', { name: /d20/ }).click();
      for (let i = 0; i < 3; i++) {
        await panel.getByRole('button', { name: /^Roll/ }).first().click();
        await window.waitForTimeout(300);
      }
      await expectVisible(window, window.locator('.dice-history-item').first(), 'roll history');
    });
    await window.keyboard.press('Escape');

    await shot(window, 'templates-gallery.png', async () => {
      await window.getByRole('button', { name: 'Close campaign' }).click();
      await window.waitForTimeout(1500);
      await window.locator('button').filter({ hasText: 'New Campaign' }).first().click();
      await expectVisible(window, window.getByText('Choose a Template').first(), 'template gallery');
    });

  } catch (err) {
    console.error(`\nERROR: ${err.message}`);
    process.exitCode = 1;
  } finally {
    // Restore original campaign or remove fixture copy
    try {
      if (fixtureExisted && existsSync(BACKUP_DEST)) {
        unlinkSync(FIXTURE_DEST);
        renameSync(BACKUP_DEST, FIXTURE_DEST);
        console.log('Restored original campaign from backup');
      } else if (!fixtureExisted && existsSync(FIXTURE_DEST)) {
        unlinkSync(FIXTURE_DEST);
        console.log('Cleaned up fixture copy');
      }
    } catch { /* ignore cleanup errors */ }
    if (electronApp) {
      await electronApp.close();
    }
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} screenshots captured in docs/screenshots/`);
  failed.forEach(f => console.log(`  FAILED ${f.name}: ${f.error}`));
  if (failed.length) process.exitCode = 1;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
