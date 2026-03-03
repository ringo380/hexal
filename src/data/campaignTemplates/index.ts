import type { CampaignTemplate } from '../../types/CampaignTemplate';
import { swordCoastTemplate } from './swordCoast';
import { chultTemplate } from './chult';
import { baroviaTemplate } from './barovia';
import { icewindDaleTemplate } from './icewindDale';
import { eberronTemplate } from './eberron';
import { greyhawkTemplate } from './greyhawk';
import { underdarkTemplate } from './underdark';
import { darkSunTemplate } from './darkSun';
import { seasIslandsTemplate } from './seasIslands';
import { feywildTemplate } from './feywild';

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  swordCoastTemplate,
  chultTemplate,
  baroviaTemplate,
  icewindDaleTemplate,
  eberronTemplate,
  greyhawkTemplate,
  underdarkTemplate,
  darkSunTemplate,
  seasIslandsTemplate,
  feywildTemplate,
];

export function getTemplateById(id: string): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES.find(t => t.id === id);
}
