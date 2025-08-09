// Simple test to verify Jest setup
describe('Jest Setup', () => {
  test('should run basic test', () => {
    expect(true).toBe(true);
  });

  test('should have test utilities', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.randomString).toBeDefined();
    expect(global.testUtils.testUser).toBeDefined();
    expect(global.testUtils.testPost).toBeDefined();
  });

  test('should generate random string', () => {
    const str = global.testUtils.randomString(10);
    expect(str).toHaveLength(10);
    expect(typeof str).toBe('string');
  });
});