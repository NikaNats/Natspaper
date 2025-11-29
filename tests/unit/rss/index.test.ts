import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeDescription, sanitizeMarkdownUrls } from '@/utils/rss';

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
      expect(result).toContain('Use  for variables');
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
      expect(result).not.toContain('<script>'); // HTML tags are removed
      expect(result).toContain('Click here'); // Link text is preserved
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
      expect(result).not.toContain('**');
      expect(result).not.toContain('[');
      expect(result).not.toContain('`');
    });

    it('should handle code block in description', () => {
      const description = 'Install with `npm install my-package` for production use';
      const result = sanitizeDescription(description);
      
      expect(result).toContain('Install with  for production use');
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
      
      // The HTML tags are removed, making them harmless
      expect(result).not.toContain('<img');
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

  describe('sanitizeMarkdownUrls - Robust Markdown Link Parsing', () => {
    describe('Basic Link Handling', () => {
      it('should parse simple markdown links', () => {
        const input = 'Check [this link](https://example.com) out';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('Check [this link](https://example.com) out');
      });

      it('should handle multiple links', () => {
        const input = '[Link 1](https://a.com) and [Link 2](https://b.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Link 1](https://a.com) and [Link 2](https://b.com)');
      });

      it('should preserve text without links', () => {
        const input = 'No links here, just text.';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe(input);
      });
    });

    describe('Nested Brackets in Link Text', () => {
      it('should handle nested brackets in link text', () => {
        const input = '[Click [here] for more](https://example.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Click [here] for more](https://example.com)');
      });

      it('should handle deeply nested brackets', () => {
        const input = '[Outer [Middle [Inner] text] end](https://example.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Outer [Middle [Inner] text] end](https://example.com)');
      });

      it('should handle multiple nested bracket pairs', () => {
        const input = '[First [a] and [b] section](https://example.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[First [a] and [b] section](https://example.com)');
      });
    });

    describe('Parentheses in URLs (Wikipedia-style)', () => {
      it('should handle parentheses in URLs', () => {
        const input = '[Equation](https://en.wikipedia.org/wiki/Equation_(mathematics))';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Equation](https://en.wikipedia.org/wiki/Equation_(mathematics))');
      });

      it('should handle nested parentheses in URLs', () => {
        const input = '[Topic](https://example.com/Page_(Section_(Subsection)))';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Topic](https://example.com/Page_(Section_(Subsection)))');
      });

      it('should handle multiple parentheses pairs in URL', () => {
        const input = '[Link](https://example.com/A_(B)_C_(D))';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Link](https://example.com/A_(B)_C_(D))');
      });
    });

    describe('Escaped Characters', () => {
      it('should not match escaped opening bracket', () => {
        const input = '\\[not a link](https://example.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('\\[not a link](https://example.com)');
      });

      it('should handle escaped brackets within link text', () => {
        const input = '[Text with \\] bracket](https://example.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Text with \\] bracket](https://example.com)');
      });

      it('should handle escaped parens within URL', () => {
        const input = '[Link](https://example.com/path\\)more)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Link](https://example.com/path\\)more)');
      });
    });

    describe('URL Safety Validation', () => {
      it('should block javascript: URLs', () => {
        const input = '[Click me](javascript:alert("XSS"))';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Click me](about:blank)');
      });

      it('should block data: URLs', () => {
        const input = '[Click](data:text/html,<script>alert(1)</script>)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Click](about:blank)');
      });

      it('should allow https: URLs', () => {
        const input = '[Safe](https://example.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Safe](https://example.com)');
      });

      it('should allow mailto: URLs', () => {
        const input = '[Email](mailto:test@example.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Email](mailto:test@example.com)');
      });

      it('should allow relative URLs', () => {
        const input = '[Page](/about)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Page](/about)');
      });

      it('should allow anchor URLs', () => {
        const input = '[Section](#heading)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Section](#heading)');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty link text', () => {
        const input = '[](https://example.com)';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[](https://example.com)');
      });

      it('should handle empty URL', () => {
        const input = '[Text]()';
        const result = sanitizeMarkdownUrls(input);
        // Empty URL is technically invalid, but parser should handle it
        expect(result).toContain('[Text]');
      });

      it('should handle unbalanced brackets (not a link)', () => {
        const input = '[Unclosed bracket text';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe(input);
      });

      it('should handle unbalanced parens in URL', () => {
        const input = '[Link](https://example.com/page(broken';
        const result = sanitizeMarkdownUrls(input);
        // Unbalanced - should not parse as a link
        expect(result).toBe(input);
      });

      it('should handle bracket without following paren', () => {
        const input = '[Just brackets] not a link';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe(input);
      });

      it('should trim whitespace in URLs', () => {
        const input = '[Link](  https://example.com  )';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Link](https://example.com)');
      });

      it('should handle very long input by truncating', () => {
        const longInput = '[Link](https://example.com) '.repeat(500);
        const result = sanitizeMarkdownUrls(longInput);
        expect(result.length).toBeLessThanOrEqual(4096 + 100); // Some buffer for replacements
      });
    });

    describe('Real-world Wikipedia URL Examples', () => {
      it('should handle typical Wikipedia disambiguation URLs', () => {
        const input = 'Read about [Python (programming language)](https://en.wikipedia.org/wiki/Python_(programming_language))';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('Read about [Python (programming language)](https://en.wikipedia.org/wiki/Python_(programming_language))');
      });

      it('should handle Wikipedia URLs with multiple parens', () => {
        const input = '[C++](https://en.wikipedia.org/wiki/C%2B%2B_(programming_language))';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[C++](https://en.wikipedia.org/wiki/C%2B%2B_(programming_language))');
      });
    });

    describe('Complex Mixed Content', () => {
      it('should handle links mixed with other markdown', () => {
        const input = '**Bold** and [link](https://example.com) and `code`';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('**Bold** and [link](https://example.com) and `code`');
      });

      it('should handle both nested brackets AND parens in URL', () => {
        const input = '[Topic [subtopic]](https://example.com/Page_(Section))';
        const result = sanitizeMarkdownUrls(input);
        expect(result).toBe('[Topic [subtopic]](https://example.com/Page_(Section))');
      });
    });
  });
});
