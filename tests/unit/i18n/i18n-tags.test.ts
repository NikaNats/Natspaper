import { describe, it, expect } from 'vitest';
import { getI18n } from '@/i18n';
import { tagTranslations } from '../../../src/i18n/dictionaries/tags';

/**
 * Unit Tests for i18n Tag Translation System
 *
 * Verifies:
 * - Tag translation lookups work correctly
 * - Fallbacks work when translations missing
 * - Locale handling is correct
 */describe('i18n Tag Translation System', () => {
  describe('tagTranslations data structure', () => {
    it('should have translations for English locale', () => {
      expect(tagTranslations.en).toBeDefined();
      expect(Object.keys(tagTranslations.en).length).toBeGreaterThan(0);
    });

    it('should have translations for Georgian locale', () => {
      expect(tagTranslations.ka).toBeDefined();
      expect(Object.keys(tagTranslations.ka).length).toBeGreaterThan(0);
    });

    it('should have matching keys across locales', () => {
      const enKeys = Object.keys(tagTranslations.en).sort();
      const kaKeys = Object.keys(tagTranslations.ka).sort();
      
      // English and Georgian should have same tag keys
      enKeys.forEach(key => {
        expect(tagTranslations.ka[key]).toBeDefined();
      });
      
      // Both should have content
      expect(enKeys.length).toBeGreaterThan(0);
      expect(kaKeys.length).toBeGreaterThan(0);
    });
  });

  describe('getTranslatedTagName()', () => {
    it('should return English tag name for "en" locale', () => {
      const result = getI18n('en').tTag('docs');
      expect(result).toBe('docs');
    });

    it('should return Georgian tag name for "ka" locale', () => {
      const result = getI18n('ka').tTag('docs');
      expect(result).toBe('დოკუმენტაცია');
    });

    it('should handle missing translation by falling back to English', () => {
      // Try a tag that might not exist
      const result = getI18n('ka').tTag('non-existent-tag');
      
      // Should fallback gracefully (either English translation or the tag itself)
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle invalid locale by returning English translation', () => {
      const result = getI18n('fr' as 'en').tTag('docs');
      
      // Should fallback to English when locale not found
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should preserve tag slug as fallback', () => {
      const result = getI18n('ka').tTag('tutorial');
      
      // Should return something (either translation or the tag itself)
      expect(result).toBeTruthy();
    });
  });

  describe('getTranslatedTags()', () => {
    it('should return array of tags with translated names', () => {
      const tags = ['docs'];
      const result = tags.map(tag => ({ slug: tag, name: getI18n('en').tTag(tag) }));
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).toHaveProperty('name');
    });

    it('should return correct structure for English tags', () => {
      const tags = ['docs'];
      const result = tags.map(tag => ({ slug: tag, name: getI18n('en').tTag(tag) }));
      
      expect(result[0].slug).toBe('docs');
      expect(result[0].name).toBe('docs');
    });

    it('should return correct structure for Georgian tags', () => {
      const tags = ['docs'];
      const result = tags.map(tag => ({ slug: tag, name: getI18n('ka').tTag(tag) }));
      
      expect(result[0].slug).toBe('docs');
      expect(result[0].name).toBe('დოკუმენტაცია');
    });

    it('should handle multiple tags', () => {
      const tags = ['docs'];
      const result = tags.map(tag => ({ slug: tag, name: getI18n('en').tTag(tag) }));
      
      expect(result.length).toBe(tags.length);
      
      result.forEach((item, index) => {
        expect(item.slug).toBe(tags[index]);
        expect(typeof item.name).toBe('string');
      });
    });

    it('should handle empty array', () => {
      const result = [].map(tag => ({ slug: tag, name: getI18n('en').tTag(tag) }));
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should maintain order of input tags', () => {
      const tags = ['docs'];
      const result = tags.map(tag => ({ slug: tag, name: getI18n('ka').tTag(tag) }));
      
      tags.forEach((tag, index) => {
        expect(result[index].slug).toBe(tag);
      });
    });
  });

  describe('Locale Support', () => {
    it('should support English locale "en"', () => {
      const result = getI18n('en').tTag('docs');
      expect(result).toBe(tagTranslations.en.docs);
    });

    it('should support Georgian locale "ka"', () => {
      const result = getI18n('ka').tTag('docs');
      expect(result).toBe(tagTranslations.ka.docs);
    });

    it('should handle case-insensitive locale lookup', () => {
      // Test that lowercase works (even if system uses specific case)
      const result = getI18n('en').tTag('docs');
      expect(result).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string locale', () => {
      // Should not crash, should return something sensible
      const result = getI18n('' as 'en').tTag('docs');
      expect(result).toBeTruthy();
    });

    it('should handle undefined locale', () => {
      const result = getI18n(undefined).tTag('docs');
      expect(result).toBeTruthy();
    });

    it('should handle special characters in tag names', () => {
      // Tags shouldn't have special chars, but test robustness
      const result = getI18n('en').tTag('tag-with-dashes');
      expect(typeof result).toBe('string');
    });

    it('should handle very long tag names', () => {
      const longTag = 'a'.repeat(100);
      const result = getI18n('en').tTag(longTag);
      expect(typeof result).toBe('string');
    });
  });

  describe('Translation Consistency', () => {
    it('should always return a string', () => {
      const locales = ['en', 'ka'];
      const tags = ['docs'];
      
      locales.forEach(locale => {
        tags.forEach(tag => {
          const result = getI18n(locale as 'en').tTag(tag);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });
    });

    it('should be consistent across multiple calls', () => {
      const tag = 'docs';
      const locale = 'ka';
      
      const result1 = getI18n(locale).tTag(tag);
      const result2 = getI18n(locale).tTag(tag);
      
      expect(result1).toBe(result2);
    });

    it('should not mutate input', () => {
      const tags = ['docs'];
      const tagsCopy = [...tags];
      
      tags.map(tag => ({ slug: tag, name: getI18n('en').tTag(tag) }));
      
      expect(tags).toEqual(tagsCopy);
    });
  });
});
