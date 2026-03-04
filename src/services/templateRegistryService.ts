// Community template registry service — fetches the registry index
// and individual templates from GitHub Pages.

import type { TemplateRegistry, TemplateRegistryEntry } from '../types/CampaignTemplate';
import type { CampaignTemplate } from '../types/CampaignTemplate';
import { validateTemplate } from './templateService';

const REGISTRY_URL = 'https://ringo380.github.io/hexal/templates/registry.json';
const FETCH_TIMEOUT = 10_000;

// Session-level cache
let cachedRegistry: TemplateRegistry | null = null;

/** Fetch the community template registry (cached per session). */
export async function fetchRegistry(): Promise<TemplateRegistry> {
  if (cachedRegistry) return cachedRegistry;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(REGISTRY_URL, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Registry fetch failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!data || data.version !== 1 || !Array.isArray(data.templates)) {
      throw new Error('Invalid registry format');
    }
    cachedRegistry = data as TemplateRegistry;
    return cachedRegistry;
  } finally {
    clearTimeout(timeout);
  }
}

/** Clear the cached registry (e.g., for retry). */
export function clearRegistryCache(): void {
  cachedRegistry = null;
}

/** Fetch an individual community template by registry entry. */
export async function fetchCommunityTemplate(
  entry: TemplateRegistryEntry
): Promise<CampaignTemplate> {
  // downloadUrl is relative to the registry base
  const baseUrl = REGISTRY_URL.replace(/\/[^/]+$/, '/');
  const url = new URL(entry.downloadUrl, baseUrl).href;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Template fetch failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const validation = validateTemplate(data);
    if (!validation.valid) {
      throw new Error(`Invalid community template: ${validation.errors.join(', ')}`);
    }
    return validation.template!;
  } finally {
    clearTimeout(timeout);
  }
}
