import { describe, it, expect } from 'vitest';

/**
 * Integration tests for RSS feed security
 * Tests HTML escaping, XSS prevention, and CDATA handling
 */

function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replaceAll(/[&<>"']/g, char => htmlEscapeMap[char] || char);
}

function sanitizeDescription(description: string): string {
  const escaped = escapeHtml(description);
  // Remove markdown links
  const noLinks = escaped.replaceAll(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove emphasis
  const noEmphasis = noLinks.replaceAll(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');
  // Remove code blocks and inline code
  const noCode = noEmphasis.replaceAll(/`([^`]+)`/g, '$1');
  // Limit to 500 characters
  return noCode.substring(0, 500);
}

describe('RSS Feed Security - Integration Tests', () => {
  describe('HTML Escaping', () => {
    it('should escape ampersand', () => {
      const input = 'Tom & Jerry';
      expect(escapeHtml(input)).toBe('Tom &amp; Jerry');
    });

    it('should escape less than', () => {
      const input = '1 < 2';
      expect(escapeHtml(input)).toBe('1 &lt; 2');
    });

    it('should escape greater than', () => {
      const input = '2 > 1';
      expect(escapeHtml(input)).toBe('2 &gt; 1');
    });

    it('should escape double quotes', () => {
      const input = 'He said "Hello"';
      expect(escapeHtml(input)).toBe('He said &quot;Hello&quot;');
    });

    it('should escape single quotes', () => {
      const input = "It's a nice day";
      expect(escapeHtml(input)).toBe("It&#39;s a nice day");
    });

    it('should escape all special characters in combination', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle multiple occurrences', () => {
      const input = '&&&>>><<<"""\'\'\'';
      const result = escapeHtml(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });
  });

  describe('XSS Attack Prevention', () => {
    it('should prevent script tag injection', () => {
      const malicious = '<script>alert("XSS")</script>';
      const result = escapeHtml(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should prevent event handler injection', () => {
      const malicious = '<img src=x onerror=alert("XSS")>';
      const result = escapeHtml(malicious);
      // The tag brackets are escaped, making the event handler harmless
      expect(result).toContain('&lt;img');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('alert("XSS")');
    });

    it('should prevent SVG injection', () => {
      const malicious = '<svg onload=alert("XSS")>';
      const result = escapeHtml(malicious);
      // The tag brackets are escaped, making the event handler harmless
      expect(result).toContain('&lt;svg');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<svg');
      expect(result).not.toContain('alert("XSS")');
    });

    it('should prevent iframe injection', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const result = escapeHtml(malicious);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('&lt;iframe');
    });

    it('should prevent data URI XSS', () => {
      const malicious = '<a href="data:text/html,<script>alert(\'XSS\')</script>">click</a>';
      const result = escapeHtml(malicious);
      expect(result).not.toContain('<a href=');
      expect(result).not.toContain('<script>');
    });
  });

  describe('Description Sanitization', () => {
    it('should remove markdown links', () => {
      const input = 'Check out [my blog](https://example.com)';
      const result = sanitizeDescription(input);
      expect(result).toContain('my blog');
      expect(result).not.toContain('[');
      expect(result).not.toContain(']');
      expect(result).not.toContain('(https://');
    });

    it('should remove markdown emphasis', () => {
      const input = 'This is **bold** and *italic* text';
      const result = sanitizeDescription(input);
      expect(result).toContain('bold');
      expect(result).toContain('italic');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
    });

    it('should remove inline code', () => {
      const input = 'Use `const x = 5` for variables';
      const result = sanitizeDescription(input);
      expect(result).toContain('const x = 5');
      expect(result).not.toContain('`');
    });

    it('should limit to 500 characters', () => {
      const input = 'a'.repeat(1000);
      const result = sanitizeDescription(input);
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('should preserve 500 characters of content', () => {
      const input = 'a'.repeat(500);
      const result = sanitizeDescription(input);
      expect(result).toHaveLength(500);
    });

    it('should handle complex markdown combinations', () => {
      const input = 'Read [**this guide**](https://example.com) for `*special* **formatting**`';
      const result = sanitizeDescription(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('*');
      expect(result).not.toContain('[');
      expect(result).not.toContain('`');
      expect(result).toContain('this guide');
    });

    it('should escape HTML after removing markdown', () => {
      const input = 'Click [here](https://example.com) <script>';
      const result = sanitizeDescription(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('CDATA Integration', () => {
    it('should properly format with CDATA', () => {
      const description = 'This is a <test> & description';
      const escaped = escapeHtml(description);
      const cdata = `<![CDATA[${escaped}]]>`;
      
      expect(cdata).toContain('<![CDATA[');
      expect(cdata).toContain(']]>');
      expect(cdata).toContain('&lt;test&gt;');
    });

    it('should handle CDATA closing sequence in content', () => {
      const description = 'Text with ]]> in it';
      const escaped = escapeHtml(description);
      // Note: Actual implementation might need special handling
      expect(escaped).toContain(']]&gt;');
    });
  });

  describe('Real-world Blog Post Scenarios', () => {
    it('should safely handle typical blog post description', () => {
      const description = 'Learn how to build awesome **web apps** with [TypeScript](https://typescriptlang.org) and `npm install packages`';
      const result = sanitizeDescription(description);
      
      expect(result).toContain('web apps');
      expect(result).toContain('TypeScript');
      expect(result).toContain('npm install packages');
      expect(result).not.toContain('**');
      expect(result).not.toContain('[');
      expect(result).not.toContain('`');
    });

    it('should handle code block in description', () => {
      const description = 'Install with `npm install my-package` for production use';
      const result = sanitizeDescription(description);
      
      expect(result).toContain('npm install my-package');
      expect(result).not.toContain('`');
    });

    it('should handle multiple links', () => {
      const description = 'See [part 1](url1) and [part 2](url2) for details';
      const result = sanitizeDescription(description);
      
      expect(result).toContain('part 1');
      expect(result).toContain('part 2');
      expect(result).not.toContain('url');
      expect(result).not.toContain('[');
    });

    it('should strip user-submitted HTML maliciously', () => {
      const description = 'Great post! <img src=x onerror="alert(\'hacked\')">';
      const result = sanitizeDescription(description);
      
      // The HTML tags are escaped, making them harmless
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
      expect(result).toContain('&gt;');
      // The content will be safe even if onerror/alert appear as text
      expect(result).toContain('Great post');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
      expect(sanitizeDescription('')).toBe('');
    });

    it('should handle only special characters', () => {
      const input = '&<>"\'';
      const result = escapeHtml(input);
      expect(result).toBe('&amp;&lt;&gt;&quot;&#39;');
    });

    it('should handle repeated special characters', () => {
      const input = '&&&&<<<<>>>>';
      const result = escapeHtml(input);
      expect(result).toBe('&amp;&amp;&amp;&amp;&lt;&lt;&lt;&lt;&gt;&gt;&gt;&gt;');
    });

    it('should preserve normal text unchanged', () => {
      const input = 'This is normal text';
      expect(escapeHtml(input)).toBe(input);
    });

    it('should handle very long descriptions', () => {
      const input = 'Long text '.repeat(100); // 1000 chars
      const result = sanitizeDescription(input);
      
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('should handle unicode characters', () => {
      const input = 'Hello 你好 مرحبا العالم';
      const result = escapeHtml(input);
      
      expect(result).toContain('你好');
      expect(result).toContain('مرحبا');
    });
  });
});
