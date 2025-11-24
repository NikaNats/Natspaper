import { describe, it, expect } from 'vitest';
import { slugifyStr } from '../../src/utils/core/slugify';

describe('slugifyStr', () => {
  it('converts string to kebab-case', () => {
    expect(slugifyStr('Hello World')).toBe('hello-world');
  });
  
  it('handles special characters', () => {
    expect(slugifyStr('C# Programming')).toBe('c-sharp-programming');
  });
});
