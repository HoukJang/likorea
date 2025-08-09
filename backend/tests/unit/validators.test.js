const {
  validateEmail,
  validatePassword,
  validateId,
  validateTitle,
  validateContent,
  validateAuthority,
  sanitizeInput
} = require('../../utils/validators');

describe('Validators Unit Tests', () => {
  describe('validateEmail', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.kr',
        'first+last@test.org',
        'email_123@sub.domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    test('should accept valid passwords', () => {
      const validPasswords = [
        'password123',
        'StrongP@ss123',
        '12345678',
        'veryLongPasswordThatIsDefinitelyValid123'
      ];

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    test('should reject invalid passwords', () => {
      const invalidPasswords = [
        'short',
        '',
        null,
        undefined,
        '1234567' // Too short
      ];

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });
  });

  describe('validateId', () => {
    test('should accept valid IDs', () => {
      const validIds = [
        'user123',
        'test_user',
        'john_doe_2023',
        'admin'
      ];

      validIds.forEach(id => {
        expect(validateId(id)).toBe(true);
      });
    });

    test('should reject invalid IDs', () => {
      const invalidIds = [
        'ab', // Too short
        'user with spaces',
        'user@email',
        '',
        null,
        undefined,
        'a'.repeat(51) // Too long
      ];

      invalidIds.forEach(id => {
        expect(validateId(id)).toBe(false);
      });
    });
  });

  describe('validateTitle', () => {
    test('should accept valid titles', () => {
      const validTitles = [
        'Hello World',
        '안녕하세요',
        'Test Post 123!',
        'A'.repeat(100) // Max length
      ];

      validTitles.forEach(title => {
        expect(validateTitle(title)).toBe(true);
      });
    });

    test('should reject invalid titles', () => {
      const invalidTitles = [
        '',
        null,
        undefined,
        'A'.repeat(101) // Too long
      ];

      invalidTitles.forEach(title => {
        expect(validateTitle(title)).toBe(false);
      });
    });
  });

  describe('validateContent', () => {
    test('should accept valid content', () => {
      const validContent = [
        'Simple content',
        '<p>HTML content</p>',
        'A'.repeat(5000),
        '한글 콘텐츠 테스트'
      ];

      validContent.forEach(content => {
        expect(validateContent(content)).toBe(true);
      });
    });

    test('should reject invalid content', () => {
      const invalidContent = [
        '',
        null,
        undefined
      ];

      invalidContent.forEach(content => {
        expect(validateContent(content)).toBe(false);
      });
    });
  });

  describe('validateAuthority', () => {
    test('should accept valid authority levels', () => {
      [1, 2, 3, 4, 5].forEach(level => {
        expect(validateAuthority(level)).toBe(true);
      });
    });

    test('should reject invalid authority levels', () => {
      const invalidLevels = [0, 6, -1, 1.5, '3', null, undefined];

      invalidLevels.forEach(level => {
        expect(validateAuthority(level)).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    test('should remove script tags', () => {
      const input = 'Hello <script>alert("XSS")</script> World';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    test('should handle null and undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    test('should escape HTML tags', () => {
      const htmlInput = '<p>Hello <strong>World</strong></p>';
      const sanitized = sanitizeInput(htmlInput);
      expect(sanitized).toBe('&lt;p&gt;Hello &lt;strong&gt;World&lt;&#x2F;strong&gt;&lt;&#x2F;p&gt;');
      expect(sanitized).not.toContain('<p>');
      expect(sanitized).not.toContain('<strong>');
    });
  });
});