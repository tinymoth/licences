const {allValuesEmpty, interleave, equals} = require('../../server/utils/functionalHelpers');

describe('functionalHelpers', () => {
    describe('allValuesEmpty', () => {
        it('should return true for object of empty strings', () => {
            const input = {a: '', b: ''};
            const expectedOutput = true;

            expect(allValuesEmpty(input)).to.equal(expectedOutput);
        });

        it('should return true for object of empty items', () => {
            const input = {a: '', b: [], c: {}, d: undefined};
            const expectedOutput = true;

            expect(allValuesEmpty(input)).to.equal(expectedOutput);
        });

        it('should return false for array with a string', () => {
            const input = {a: '', b: 'g'};
            const expectedOutput = false;

            expect(allValuesEmpty(input)).to.equal(expectedOutput);
        });
    });

    describe('interleave', () => {

        const examples = [
            [[], [], ''],
            [[], ['a'], ''],
            [['1'], [], '1'],
            [['1'], ['a'], '1a'],
            [['1', '2'], ['a'], '1a2'],
            [['1', '2'], ['a', 'b'], '1a2b'],
            [['1', '2', '3', '4', '5'], ['a', 'b'], '1a2b345'],
            [['1', '2'], ['a', 'b', 'c', 'd', 'e'], '1a2b']
        ];

        examples
            .forEach(([first, second, result]) => {
                it(`should return '${result}' for [${first}] with [${second}]`, () => {
                    expect(interleave(first, second)).to.equal(result);
                });
            });
    });

    describe('equals', () => {
        it('should return true if objects are equal', () => {
            expect(equals({a: 'a'}, {a: 'a'})).to.eql(true);
        });

        it('should return true if deep nested objects are equal', () => {
            expect(equals({a: 'a', b: {c: {d: 'e'}}}, {b: {c: {d: 'e'}}, a: 'a'})).to.eql(true);
        });

        it('should return false if deep nested objects are not equal', () => {
            expect(equals({a: 'a', b: {c: {d: 'e'}}}, {b: {c: {d: 'f'}}, a: 'a'})).to.eql(false);
        });

        it('should return true if arrays are equal', () => {
            expect(equals(['a', 'b'], ['a', 'b'])).to.eql(true);
        });

        it('should return false if arrays arent equal', () => {
            expect(equals(['a', 'b'], ['b', 'a'])).to.eql(false);
        });
    });

});
