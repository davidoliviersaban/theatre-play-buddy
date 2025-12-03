/**
 * Unit Tests: Multi-Character Attribution Helpers
 * 
 * Tests for multi-speaker line utilities:
 * - getSpeakerIds: Extract character IDs from lines with single or multiple speakers
 */

import { getSpeakerIds } from '@/lib/play/multi-character';
import type { Line } from '@/lib/play/schemas';

describe('getSpeakerIds', () => {
  describe('single-character lines', () => {
    it('should return single character ID for dialogue', () => {
      const line: Line = {
        id: 'line-1',
        characterId: 'char-hamlet',
        text: 'To be or not to be',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(['char-hamlet']);
    });

    it('should return single character ID for character-specific stage direction', () => {
      const line: Line = {
        id: 'line-2',
        characterId: 'char-ophelia',
        text: 'Ophelia exits weeping',
        type: 'stage_direction',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(['char-ophelia']);
    });
  });

  describe('multi-character lines', () => {
    it('should return multiple character IDs from characterIdArray', () => {
      const line: Line = {
        id: 'line-3',
        characterIdArray: ['char-romeo', 'char-juliet'],
        text: 'Together forever!',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(['char-romeo', 'char-juliet']);
    });

    it('should return single ID from characterIdArray with one element', () => {
      const line: Line = {
        id: 'line-4',
        characterIdArray: ['char-hamlet'],
        text: 'Solo speaker in array',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(['char-hamlet']);
    });

    it('should return multiple IDs for multi-character stage direction', () => {
      const line: Line = {
        id: 'line-5',
        characterIdArray: ['char-rosencrantz', 'char-guildenstern'],
        text: 'They exit together',
        type: 'stage_direction',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(['char-rosencrantz', 'char-guildenstern']);
    });

    it('should handle large ensemble casts', () => {
      const ensemble = [
        'char-chorus-1',
        'char-chorus-2',
        'char-chorus-3',
        'char-chorus-4',
        'char-chorus-5',
      ];

      const line: Line = {
        id: 'line-6',
        characterIdArray: ensemble,
        text: 'ALL TOGETHER NOW!',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(ensemble);
    });
  });

  describe('general stage directions (no character)', () => {
    it('should return empty array for general stage direction', () => {
      const line: Line = {
        id: 'line-7',
        text: 'Thunder and lightning',
        type: 'stage_direction',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual([]);
    });

    it('should return empty array for scene-level direction', () => {
      const line: Line = {
        id: 'line-8',
        text: 'The curtain rises',
        type: 'stage_direction',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual([]);
    });
  });

  describe('priority: characterIdArray over characterId', () => {
    it('should prefer characterIdArray when both exist', () => {
      const line: Line = {
        id: 'line-9',
        characterId: 'char-hamlet',
        characterIdArray: ['char-romeo', 'char-juliet'],
        text: 'Test line',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(['char-romeo', 'char-juliet']);
    });

    it('should use characterId when characterIdArray is empty (edge case)', () => {
      const line: Line = {
        id: 'line-10',
        characterId: 'char-hamlet',
        characterIdArray: [],
        text: 'Test line',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      // Empty array falls through to characterId
      expect(result).toEqual(['char-hamlet']);
    });
  });

  describe('return value consistency', () => {
    it('should always return an array', () => {
      const testCases: Line[] = [
        {
          id: 'test-1',
          characterId: 'char-1',
          text: 'Single',
          type: 'dialogue',
        },
        {
          id: 'test-2',
          characterIdArray: ['char-1', 'char-2'],
          text: 'Multiple',
          type: 'dialogue',
        },
        {
          id: 'test-3',
          text: 'None',
          type: 'stage_direction',
        },
      ];

      testCases.forEach((line) => {
        const result = getSpeakerIds(line);
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should preserve order of character IDs', () => {
      const line: Line = {
        id: 'line-11',
        characterIdArray: ['char-z', 'char-a', 'char-m'],
        text: 'Order test',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(['char-z', 'char-a', 'char-m']);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined characterId gracefully', () => {
      const line: Line = {
        id: 'line-12',
        characterId: undefined,
        text: 'No speaker',
        type: 'stage_direction',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual([]);
    });

    it('should handle empty string characterId', () => {
      const line: Line = {
        id: 'line-13',
        characterId: '',
        text: 'Empty ID',
        type: 'stage_direction',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual([]);
    });

    it('should handle characterIdArray with empty strings', () => {
      const line: Line = {
        id: 'line-14',
        characterIdArray: ['char-1', '', 'char-2'],
        text: 'Mixed',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      // Returns array as-is, including empty strings (validation should catch this)
      expect(result).toEqual(['char-1', '', 'char-2']);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle "BOTH" scenario (two characters speaking together)', () => {
      const line: Line = {
        id: 'line-15',
        characterIdArray: ['char-romeo', 'char-juliet'],
        text: 'We do!',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      expect(result).toHaveLength(2);
      expect(result).toContain('char-romeo');
      expect(result).toContain('char-juliet');
    });

    it('should handle "ALL" scenario (full cast)', () => {
      const cast = ['char-1', 'char-2', 'char-3', 'char-4'];
      const line: Line = {
        id: 'line-16',
        characterIdArray: cast,
        text: 'Hail Caesar!',
        type: 'dialogue',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(cast);
    });

    it('should handle stage direction affecting multiple characters', () => {
      const line: Line = {
        id: 'line-17',
        characterIdArray: ['char-macbeth', 'char-banquo'],
        text: 'They draw their swords',
        type: 'stage_direction',
      };

      const result = getSpeakerIds(line);
      expect(result).toEqual(['char-macbeth', 'char-banquo']);
    });

    it('should handle entrance direction with multiple characters', () => {
      const line: Line = {
        id: 'line-18',
        characterIdArray: [
          'char-king',
          'char-queen',
          'char-prince',
          'char-courtier-1',
          'char-courtier-2',
        ],
        text: 'Enter the royal court',
        type: 'stage_direction',
      };

      const result = getSpeakerIds(line);
      expect(result).toHaveLength(5);
    });
  });
});
