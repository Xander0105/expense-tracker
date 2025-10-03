// Basic test without any imports
describe('Basic Functionality', () => {
    test('should work with basic JavaScript', () => {
        const obj = { name: 'test', value: 42 };
        expect(obj.name).toBe('test');
        expect(obj.value).toBe(42);
    });

    test('should work with arrays', () => {
        const arr = [1, 2, 3];
        expect(arr.length).toBe(3);
        expect(arr[0]).toBe(1);
    });
});
