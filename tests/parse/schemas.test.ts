/**
 * Unit Tests: Zod Schemas and Validation
 * 
 * Tests for Playbook data structure schemas including:
 * - Character, Line, Scene, Act, and Playbook schemas
 * - Validation refinements (dialogue must have characterId)
 * - Edge cases and error messages
 */

import {
  CharacterSchema,
  LineSchema,
  SceneSchema,
  ActSchema,
  PlaybookSchema,
  FormattingMetadataSchema,
  type Line,
} from '@/lib/play/schemas';

describe('CharacterSchema', () => {
  it('should validate a basic character', () => {
    const character = {
      id: 'char-1',
      name: 'Hamlet',
      description: 'Prince of Denmark',
    };

    const result = CharacterSchema.safeParse(character);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(character);
    }
  });

  it('should validate character without description', () => {
    const character = {
      id: 'char-2',
      name: 'Ophelia',
    };

    const result = CharacterSchema.safeParse(character);
    expect(result.success).toBe(true);
  });

  it('should accept character without id (id generated server-side)', () => {
    const character = {
      name: 'Hamlet',
    };

    const result = CharacterSchema.safeParse(character);
    expect(result.success).toBe(true);
  });

  it('should reject character without name', () => {
    const character = {
      id: 'char-1',
    };

    const result = CharacterSchema.safeParse(character);
    expect(result.success).toBe(false);
  });
});

describe('FormattingMetadataSchema', () => {
  it('should validate formatting with indentLevel', () => {
    const formatting = { indentLevel: 2 };
    const result = FormattingMetadataSchema.safeParse(formatting);
    expect(result.success).toBe(true);
  });

  it('should validate formatting with preserveLineBreaks', () => {
    const formatting = { preserveLineBreaks: true };
    const result = FormattingMetadataSchema.safeParse(formatting);
    expect(result.success).toBe(true);
  });

  it('should validate formatting with both properties', () => {
    const formatting = { indentLevel: 1, preserveLineBreaks: true };
    const result = FormattingMetadataSchema.safeParse(formatting);
    expect(result.success).toBe(true);
  });

  it('should reject indentLevel below 0', () => {
    const formatting = { indentLevel: -1 };
    const result = FormattingMetadataSchema.safeParse(formatting);
    expect(result.success).toBe(false);
  });

  it('should reject indentLevel above 5', () => {
    const formatting = { indentLevel: 6 };
    const result = FormattingMetadataSchema.safeParse(formatting);
    expect(result.success).toBe(false);
  });

  it('should allow undefined (optional)', () => {
    const result = FormattingMetadataSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });
});

describe('LineSchema', () => {
  describe('single-character dialogue', () => {
    it('should validate dialogue with characterId', () => {
      const line: Line = {
        id: 'line-1',
        characterId: 'char-1',
        text: 'To be or not to be',
        type: 'dialogue',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });

    it('should validate dialogue with characterId and formatting', () => {
      const line = {
        id: 'line-1',
        characterId: 'char-1',
        text: 'To be or not to be',
        type: 'dialogue',
        formatting: { indentLevel: 2 },
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });
  });

  describe('multi-character dialogue', () => {
    it('should validate dialogue with characterIdArray', () => {
      const line = {
        id: 'line-2',
        characterIdArray: ['char-1', 'char-2'],
        text: 'Together we stand!',
        type: 'dialogue',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });

    it('should validate dialogue with single character in array', () => {
      const line = {
        id: 'line-3',
        characterIdArray: ['char-1'],
        text: 'Solo in array',
        type: 'dialogue',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });

    it('should reject dialogue with empty characterIdArray', () => {
      const line = {
        id: 'line-4',
        characterIdArray: [],
        text: 'No speakers',
        type: 'dialogue',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'Dialogue must have characterId or characterIdArray'
        );
      }
    });
  });

  describe('stage directions', () => {
    it('should validate stage direction without characterId', () => {
      const line = {
        id: 'line-5',
        text: 'Exit stage left',
        type: 'stage_direction',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });

    it('should validate stage direction with characterId (character-specific)', () => {
      const line = {
        id: 'line-6',
        characterId: 'char-1',
        text: 'Hamlet draws his sword',
        type: 'stage_direction',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });

    it('should validate stage direction with characterIdArray', () => {
      const line = {
        id: 'line-7',
        characterIdArray: ['char-1', 'char-2'],
        text: 'They exit together',
        type: 'stage_direction',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });
  });

  describe('validation refinements', () => {
    it('should reject dialogue without characterId or characterIdArray', () => {
      const line = {
        id: 'line-8',
        text: 'Unattributed dialogue',
        type: 'dialogue',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'Dialogue must have characterId or characterIdArray'
        );
      }
    });

    it('should reject line without text', () => {
      const line = {
        id: 'line-9',
        characterId: 'char-1',
        type: 'dialogue',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('should reject line without type', () => {
      const line = {
        id: 'line-10',
        characterId: 'char-1',
        text: 'Some text',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('should reject line with invalid type', () => {
      const line = {
        id: 'line-11',
        characterId: 'char-1',
        text: 'Some text',
        type: 'invalid_type',
      };

      const result = LineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });
  });
});

describe('SceneSchema', () => {
  it('should validate scene with lines', () => {
    const scene = {
      id: 'scene-1',
      title: 'Scene 1: The Castle',
      lines: [
        {
          id: 'line-1',
          characterId: 'char-1',
          text: 'To be or not to be',
          type: 'dialogue' as const,
        },
        {
          id: 'line-2',
          text: 'Thunder',
          type: 'stage_direction' as const,
        },
      ],
    };

    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(true);
  });

  it('should accept scene without id (id generated server-side)', () => {
    const scene = {
      title: 'Scene 1',
      lines: [],
    };

    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(true);
  });

  it('should reject scene without title', () => {
    const scene = {
      id: 'scene-1',
      lines: [],
    };

    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(false);
  });

  it('should reject scene without lines array', () => {
    const scene = {
      id: 'scene-1',
      title: 'Scene 1',
    };

    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(false);
  });
});

describe('ActSchema', () => {
  it('should validate act with scenes', () => {
    const act = {
      id: 'act-1',
      title: 'Act I',
      scenes: [
        {
          id: 'scene-1',
          title: 'Scene 1',
          lines: [
            {
              id: 'line-1',
              characterId: 'char-1',
              text: 'Hello',
              type: 'dialogue' as const,
            },
          ],
        },
      ],
    };

    const result = ActSchema.safeParse(act);
    expect(result.success).toBe(true);
  });

  it('should accept act without id (id generated server-side)', () => {
    const act = {
      title: 'Act I',
      scenes: [],
    };

    const result = ActSchema.safeParse(act);
    expect(result.success).toBe(true);
  });

  it('should reject act without title', () => {
    const act = {
      id: 'act-1',
      scenes: [],
    };

    const result = ActSchema.safeParse(act);
    expect(result.success).toBe(false);
  });
});

describe('PlaybookSchema', () => {
  it('should validate complete playbook', () => {
    const playbook = {
      id: 'play-1',
      title: 'Hamlet',
      author: 'William Shakespeare',
      year: 1600,
      genre: 'Tragedy',
      description: 'The Prince of Denmark seeks revenge',
      characters: [
        {
          id: 'char-1',
          name: 'Hamlet',
          description: 'Prince of Denmark',
        },
      ],
      acts: [
        {
          id: 'act-1',
          title: 'Act I',
          scenes: [
            {
              id: 'scene-1',
              title: 'Scene 1',
              lines: [
                {
                  id: 'line-1',
                  characterId: 'char-1',
                  text: 'To be or not to be',
                  type: 'dialogue' as const,
                },
              ],
            },
          ],
        },
      ],
    };

    const result = PlaybookSchema.safeParse(playbook);
    expect(result.success).toBe(true);
  });

  it('should accept playbook without id (id generated server-side)', () => {
    const playbook = {
      title: 'Hamlet',
      author: 'Shakespeare',
      year: 1600,
      genre: 'Tragedy',
      description: 'A play',
      characters: [],
      acts: [],
    };

    const result = PlaybookSchema.safeParse(playbook);
    expect(result.success).toBe(true);
  });

  it('should reject playbook without title', () => {
    const playbook = {
      id: 'play-1',
      author: 'Shakespeare',
      year: 1600,
      genre: 'Tragedy',
      description: 'A play',
      characters: [],
      acts: [],
    };

    const result = PlaybookSchema.safeParse(playbook);
    expect(result.success).toBe(false);
  });

  it('should reject playbook without author', () => {
    const playbook = {
      id: 'play-1',
      title: 'Hamlet',
      year: 1600,
      genre: 'Tragedy',
      description: 'A play',
      characters: [],
      acts: [],
    };

    const result = PlaybookSchema.safeParse(playbook);
    expect(result.success).toBe(false);
  });

  it('should accept playbook without year (optional field)', () => {
    const playbook = {
      id: 'play-1',
      title: 'Hamlet',
      author: 'Shakespeare',
      genre: 'Tragedy',
      description: 'A play',
      characters: [],
      acts: [],
    };

    const result = PlaybookSchema.safeParse(playbook);
    expect(result.success).toBe(true);
  });

  it('should reject playbook without genre', () => {
    const playbook = {
      id: 'play-1',
      title: 'Hamlet',
      author: 'Shakespeare',
      year: 1600,
      description: 'A play',
      characters: [],
      acts: [],
    };

    const result = PlaybookSchema.safeParse(playbook);
    expect(result.success).toBe(false);
  });

  it('should reject playbook without description', () => {
    const playbook = {
      id: 'play-1',
      title: 'Hamlet',
      author: 'Shakespeare',
      year: 1600,
      genre: 'Tragedy',
      characters: [],
      acts: [],
    };

    const result = PlaybookSchema.safeParse(playbook);
    expect(result.success).toBe(false);
  });
});

describe('Nested validation', () => {
  it('should catch invalid line within scene within act within playbook', () => {
    const playbook = {
      id: 'play-1',
      title: 'Test Play',
      author: 'Test Author',
      year: 2024,
      genre: 'Drama',
      description: 'Test',
      characters: [{ id: 'char-1', name: 'Actor' }],
      acts: [
        {
          id: 'act-1',
          title: 'Act 1',
          scenes: [
            {
              id: 'scene-1',
              title: 'Scene 1',
              lines: [
                {
                  id: 'line-1',
                  // Missing characterId for dialogue!
                  text: 'This should fail',
                  type: 'dialogue',
                },
              ],
            },
          ],
        },
      ],
    };

    const result = PlaybookSchema.safeParse(playbook);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors[0];
      expect(error.path).toContain('acts');
      expect(error.path).toContain('scenes');
      expect(error.path).toContain('lines');
      expect(error.message).toContain(
        'Dialogue must have characterId or characterIdArray'
      );
    }
  });
});
