// Quest & Story Arc type definitions

import type { IconName } from '../components/icons/Icon';
import type { LinkedNpcRef } from './Campaign';

// ============ QUEST STATUS ============

export type QuestStatus = 'unknown' | 'rumored' | 'active' | 'completed' | 'failed' | 'abandoned';

export const QUEST_STATUS_INFO: Record<QuestStatus, { label: string; color: string; icon: IconName }> = {
  unknown: { label: 'Unknown', color: '#666666', icon: 'circle' },
  rumored: { label: 'Rumored', color: '#9c27b0', icon: 'lightbulb' },
  active: { label: 'Active', color: '#4a9eff', icon: 'star' },
  completed: { label: 'Completed', color: '#4caf50', icon: 'check' },
  failed: { label: 'Failed', color: '#f44336', icon: 'close' },
  abandoned: { label: 'Abandoned', color: '#607d8b', icon: 'circle-filled' }
};

// ============ QUEST OBJECTIVE ============

export interface QuestObjective {
  id: string;
  description: string;
  isComplete: boolean;
  isVisibleToPlayers: boolean;
  hexKey?: string;        // "q,r" format — optional location link
  npcRef?: LinkedNpcRef;  // optional NPC link
}

// ============ QUEST ============

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  dmNotes: string;
  objectives: QuestObjective[];
  linkedHexKeys: string[];          // "q,r" format
  linkedNpcRefs: LinkedNpcRef[];
  linkedEncounterIds: string[];
  linkedClueIds: string[];
  linkedFactionIds: string[];
  storyArcId?: string;
  prerequisiteQuestIds: string[];
  isVisibleToPlayers: boolean;
  difficulty?: string;
  estimatedSessions?: number;
  xpReward?: number;
  tags: string[];
  createdAt: string;   // ISO date string
  modifiedAt: string;
}

// ============ STORY ARC ============

export type StoryArcStatus = 'planned' | 'active' | 'completed' | 'abandoned';

export const STORY_ARC_STATUS_INFO: Record<StoryArcStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: '#607d8b' },
  active: { label: 'Active', color: '#4a9eff' },
  completed: { label: 'Completed', color: '#4caf50' },
  abandoned: { label: 'Abandoned', color: '#9e9e9e' }
};

export const STORY_ARC_COLORS = [
  '#4a9eff', '#4caf50', '#f44336', '#ff9800', '#9c27b0', '#00bcd4',
  '#e91e63', '#8bc34a', '#ff5722', '#607d8b', '#3f51b5', '#cddc39'
];

export interface StoryArc {
  id: string;
  title: string;
  description: string;
  dmNotes: string;
  questIds: string[];
  status: StoryArcStatus;
  isVisibleToPlayers: boolean;
  color: string;
}

// ============ FACTORY FUNCTIONS ============

export function createQuest(title: string = ''): Quest {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    description: '',
    status: 'unknown',
    dmNotes: '',
    objectives: [],
    linkedHexKeys: [],
    linkedNpcRefs: [],
    linkedEncounterIds: [],
    linkedClueIds: [],
    linkedFactionIds: [],
    prerequisiteQuestIds: [],
    isVisibleToPlayers: false,
    tags: [],
    createdAt: now,
    modifiedAt: now
  };
}

export function createQuestObjective(description: string = ''): QuestObjective {
  return {
    id: crypto.randomUUID(),
    description,
    isComplete: false,
    isVisibleToPlayers: true
  };
}

export function createStoryArc(title: string = '', color: string = '#4a9eff'): StoryArc {
  return {
    id: crypto.randomUUID(),
    title,
    description: '',
    dmNotes: '',
    questIds: [],
    status: 'planned',
    isVisibleToPlayers: false,
    color
  };
}
