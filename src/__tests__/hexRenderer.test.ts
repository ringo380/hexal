import { describe, it, expect } from 'vitest';
import {
  resolveExportRegion,
  calculateRegionBounds,
  calculateExportDimensions
} from '../services/hexRenderer';
import { hexCenter, HEX_SIZE, canvasSize } from '../services/hexGeometry';
import { createCampaign } from '../types/Campaign';
import type { ExportRegion, MapExportOptions } from '../types/MapExport';
import { DEFAULT_EXPORT_OPTIONS } from '../types/MapExport';

// ============================================================================
// resolveExportRegion
// ============================================================================

describe('resolveExportRegion', () => {
  const gridWidth = 10;
  const gridHeight = 8;

  it('returns null for type "full"', () => {
    const region: ExportRegion = { type: 'full' };
    expect(resolveExportRegion(region, gridWidth, gridHeight)).toBeNull();
  });

  describe('type "custom"', () => {
    it('returns correct set of hex keys for valid bounds', () => {
      const region: ExportRegion = { type: 'custom', minQ: 2, maxQ: 4, minR: 1, maxR: 3 };
      const result = resolveExportRegion(region, gridWidth, gridHeight);
      expect(result).not.toBeNull();
      // 3 columns (2,3,4) x 3 rows (1,2,3) = 9 hexes
      expect(result!.size).toBe(9);
      expect(result!.has('2,1')).toBe(true);
      expect(result!.has('4,3')).toBe(true);
      expect(result!.has('3,2')).toBe(true);
      // Outside the bounds
      expect(result!.has('1,1')).toBe(false);
      expect(result!.has('5,1')).toBe(false);
    });

    it('returns null when bounds are entirely outside the grid', () => {
      const region: ExportRegion = { type: 'custom', minQ: 20, maxQ: 25, minR: 20, maxR: 25 };
      const result = resolveExportRegion(region, gridWidth, gridHeight);
      expect(result).toBeNull();
    });

    it('returns only valid keys when bounds partially overlap the grid', () => {
      // Bounds extend from q=8..12, but grid only goes 0..9
      const region: ExportRegion = { type: 'custom', minQ: 8, maxQ: 12, minR: 0, maxR: 2 };
      const result = resolveExportRegion(region, gridWidth, gridHeight);
      expect(result).not.toBeNull();
      // Only q=8,9 are in bounds (gridWidth=10 => valid q: 0-9)
      // r=0,1,2 => 2 * 3 = 6 hexes
      expect(result!.size).toBe(6);
      expect(result!.has('8,0')).toBe(true);
      expect(result!.has('9,2')).toBe(true);
      expect(result!.has('10,0')).toBe(false);
    });

    it('defaults missing bounds to grid edges', () => {
      // Only specify minQ, all others default
      const region: ExportRegion = { type: 'custom', minQ: 8 };
      const result = resolveExportRegion(region, gridWidth, gridHeight);
      expect(result).not.toBeNull();
      // q=8,9 (maxQ defaults to gridWidth-1=9), r=0..7 (gridHeight-1=7)
      expect(result!.size).toBe(2 * gridHeight);
    });
  });

  describe('type "selection"', () => {
    it('returns set from provided hex keys', () => {
      const region: ExportRegion = { type: 'selection', hexKeys: ['0,0', '3,4', '5,5'] };
      const result = resolveExportRegion(region, gridWidth, gridHeight);
      expect(result).not.toBeNull();
      expect(result!.size).toBe(3);
      expect(result!.has('0,0')).toBe(true);
      expect(result!.has('3,4')).toBe(true);
      expect(result!.has('5,5')).toBe(true);
    });

    it('returns null for empty hexKeys', () => {
      const region: ExportRegion = { type: 'selection', hexKeys: [] };
      expect(resolveExportRegion(region, gridWidth, gridHeight)).toBeNull();
    });

    it('returns null for undefined hexKeys', () => {
      const region: ExportRegion = { type: 'selection' };
      expect(resolveExportRegion(region, gridWidth, gridHeight)).toBeNull();
    });

    it('filters out invalid/out-of-bounds hex keys', () => {
      const region: ExportRegion = {
        type: 'selection',
        hexKeys: ['0,0', '999,999', 'abc', '-1,0', '3,3']
      };
      const result = resolveExportRegion(region, gridWidth, gridHeight);
      expect(result).not.toBeNull();
      // Only '0,0' and '3,3' are valid (within 0..9, 0..7)
      expect(result!.size).toBe(2);
      expect(result!.has('0,0')).toBe(true);
      expect(result!.has('3,3')).toBe(true);
    });

    it('returns null when all hex keys are invalid', () => {
      const region: ExportRegion = {
        type: 'selection',
        hexKeys: ['100,100', 'bad', '-5,-5']
      };
      expect(resolveExportRegion(region, gridWidth, gridHeight)).toBeNull();
    });
  });
});

// ============================================================================
// calculateRegionBounds
// ============================================================================

describe('calculateRegionBounds', () => {
  it('returns correct pixel bounds for a single hex', () => {
    const keys = new Set(['2,3']);
    const bounds = calculateRegionBounds(keys);
    const center = hexCenter({ q: 2, r: 3 });

    expect(bounds.minX).toBe(center.x - HEX_SIZE);
    expect(bounds.maxX).toBe(center.x + HEX_SIZE);
    expect(bounds.minY).toBe(center.y - HEX_SIZE);
    expect(bounds.maxY).toBe(center.y + HEX_SIZE);
  });

  it('returns correct pixel bounds for multiple hexes', () => {
    const keys = new Set(['0,0', '4,5']);
    const bounds = calculateRegionBounds(keys);
    const center1 = hexCenter({ q: 0, r: 0 });
    const center2 = hexCenter({ q: 4, r: 5 });

    // min should come from whichever center is leftmost/topmost minus HEX_SIZE
    expect(bounds.minX).toBe(Math.min(center1.x, center2.x) - HEX_SIZE);
    expect(bounds.minY).toBe(Math.min(center1.y, center2.y) - HEX_SIZE);
    expect(bounds.maxX).toBe(Math.max(center1.x, center2.x) + HEX_SIZE);
    expect(bounds.maxY).toBe(Math.max(center1.y, center2.y) + HEX_SIZE);
  });

  it('extends by HEX_SIZE in all directions from hex centers', () => {
    // Use three hexes and verify bounds envelope
    const keys = new Set(['1,1', '3,1', '2,4']);
    const bounds = calculateRegionBounds(keys);

    const centers = [
      hexCenter({ q: 1, r: 1 }),
      hexCenter({ q: 3, r: 1 }),
      hexCenter({ q: 2, r: 4 })
    ];

    const expectedMinX = Math.min(...centers.map(c => c.x)) - HEX_SIZE;
    const expectedMinY = Math.min(...centers.map(c => c.y)) - HEX_SIZE;
    const expectedMaxX = Math.max(...centers.map(c => c.x)) + HEX_SIZE;
    const expectedMaxY = Math.max(...centers.map(c => c.y)) + HEX_SIZE;

    expect(bounds.minX).toBeCloseTo(expectedMinX);
    expect(bounds.minY).toBeCloseTo(expectedMinY);
    expect(bounds.maxX).toBeCloseTo(expectedMaxX);
    expect(bounds.maxY).toBeCloseTo(expectedMaxY);
  });
});

// ============================================================================
// calculateExportDimensions (with region)
// ============================================================================

describe('calculateExportDimensions', () => {
  // Create a small campaign for testing
  const campaign = createCampaign('Test Campaign', 10, 8);
  const baseOptions: MapExportOptions = {
    ...DEFAULT_EXPORT_OPTIONS,
    showTitle: false,
    showLegend: false,
    showScale: false
  };

  it('with null region returns dimensions based on full grid canvasSize', () => {
    const dims = calculateExportDimensions(campaign, baseOptions, null);
    const fullSize = canvasSize(campaign.gridWidth, campaign.gridHeight);

    expect(dims.mapWidth).toBe(fullSize.width);
    expect(dims.mapHeight).toBe(fullSize.height);
    expect(dims.regionOffsetX).toBe(0);
    expect(dims.regionOffsetY).toBe(0);
  });

  it('with undefined region returns same as null (full grid)', () => {
    const dims = calculateExportDimensions(campaign, baseOptions);
    const fullSize = canvasSize(campaign.gridWidth, campaign.gridHeight);

    expect(dims.mapWidth).toBe(fullSize.width);
    expect(dims.mapHeight).toBe(fullSize.height);
    expect(dims.regionOffsetX).toBe(0);
    expect(dims.regionOffsetY).toBe(0);
  });

  it('with a region set returns smaller dimensions than full grid', () => {
    // Pick a small subset of hexes
    const regionKeys = new Set(['2,2', '3,2', '2,3']);
    const fullDims = calculateExportDimensions(campaign, baseOptions, null);
    const regionDims = calculateExportDimensions(campaign, baseOptions, regionKeys);

    // Region dimensions should be smaller than full grid
    expect(regionDims.mapWidth).toBeLessThan(fullDims.mapWidth);
    expect(regionDims.mapHeight).toBeLessThan(fullDims.mapHeight);
  });

  it('with a region set returns non-zero regionOffsetX and regionOffsetY', () => {
    // Hex 2,2 is not at origin, so offsets should be non-zero
    const regionKeys = new Set(['2,2', '3,2']);
    const dims = calculateExportDimensions(campaign, baseOptions, regionKeys);

    // regionOffset should translate the region bounds to canvas origin
    const bounds = calculateRegionBounds(regionKeys);
    expect(dims.regionOffsetX).toBe(-bounds.minX);
    expect(dims.regionOffsetY).toBe(-bounds.minY);
  });

  it('region dimensions match the region bounds extent', () => {
    const regionKeys = new Set(['1,1', '4,3']);
    const dims = calculateExportDimensions(campaign, baseOptions, regionKeys);
    const bounds = calculateRegionBounds(regionKeys);

    expect(dims.mapWidth).toBeCloseTo(bounds.maxX - bounds.minX);
    expect(dims.mapHeight).toBeCloseTo(bounds.maxY - bounds.minY);
  });

  it('includes extra height for title when showTitle is true', () => {
    const withTitle: MapExportOptions = { ...baseOptions, showTitle: true };
    const dimsNoTitle = calculateExportDimensions(campaign, baseOptions, null);
    const dimsWithTitle = calculateExportDimensions(campaign, withTitle, null);

    expect(dimsWithTitle.height).toBeGreaterThan(dimsNoTitle.height);
    expect(dimsWithTitle.offsetY).toBe(40);
  });
});
