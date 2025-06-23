describe('Basic Test Suite', () => {
    test('should pass basic assertion', () => {
        expect(true).toBe(true);
    });

    test('should handle basic math', () => {
        expect(2 + 2).toBe(4);
    });

    test('should work with strings', () => {
        expect('hello').toBe('hello');
    });

    test('should handle arrays', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    });

    test('should work with objects', () => {
        const obj = { name: 'test', value: 42 };
        expect(obj).toHaveProperty('name');
        expect(obj.value).toBe(42);
    });
});