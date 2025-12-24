import { describe, it, expect } from 'vitest';
import {
    escapeValue,
    buildCondition,
    buildWildcardSearch,
    group,
    combineWithAnd,
    combineWithOr,
    appendFilter,
    buildQueryFromFilters,
    type FiqlCondition,
} from './fiql';

describe('fiql utility', () => {
    describe('escapeValue', () => {
        it('should return simple alphanumeric values as-is', () => {
            expect(escapeValue('simple')).toBe('simple');
            expect(escapeValue('test123')).toBe('test123');
            expect(escapeValue('hello-world_test.name')).toBe('hello-world_test.name');
        });

        it('should wrap values with special characters in quotes', () => {
            expect(escapeValue('hello world')).toBe('"hello world"');
            expect(escapeValue('test;value')).toBe('"test;value"');
        });

        it('should escape double quotes within values', () => {
            expect(escapeValue('say "hello"')).toBe('"say \\"hello\\""');
        });

        it('should escape backslashes', () => {
            expect(escapeValue('path\\to\\file')).toBe('"path\\\\to\\\\file"');
        });
    });

    describe('buildCondition', () => {
        it('should build simple equality condition', () => {
            const condition: FiqlCondition = {
                field: 'name',
                operator: '==',
                value: 'test',
            };
            expect(buildCondition(condition)).toBe('name==test');
        });

        it('should handle numeric values', () => {
            const condition: FiqlCondition = {
                field: 'count',
                operator: '=gt=',
                value: 100,
            };
            expect(buildCondition(condition)).toBe('count=gt=100');
        });

        it('should handle boolean values', () => {
            const condition: FiqlCondition = {
                field: 'active',
                operator: '==',
                value: true,
            };
            expect(buildCondition(condition)).toBe('active==true');
        });

        it('should handle array values for IN operator', () => {
            const condition: FiqlCondition = {
                field: 'status',
                operator: '=in=',
                value: ['PENDING', 'IN_SYNC'],
            };
            expect(buildCondition(condition)).toBe('status=in=(PENDING,IN_SYNC)');
        });

        it('should escape special characters in string values', () => {
            const condition: FiqlCondition = {
                field: 'name',
                operator: '==',
                value: 'hello world',
            };
            expect(buildCondition(condition)).toBe('name=="hello world"');
        });
    });

    describe('buildWildcardSearch', () => {
        it('should wrap value with wildcards', () => {
            expect(buildWildcardSearch('name', 'test')).toBe('name==*test*');
        });

        it('should trim whitespace', () => {
            expect(buildWildcardSearch('name', '  test  ')).toBe('name==*test*');
        });

        it('should return empty string for empty value', () => {
            expect(buildWildcardSearch('name', '')).toBe('');
            expect(buildWildcardSearch('name', '   ')).toBe('');
        });
    });

    describe('group', () => {
        it('should wrap query with operators in parentheses', () => {
            expect(group('a==1;b==2')).toBe('(a==1;b==2)');
            expect(group('a==1,b==2')).toBe('(a==1,b==2)');
        });

        it('should not double-wrap already grouped queries', () => {
            expect(group('(a==1;b==2)')).toBe('(a==1;b==2)');
        });

        it('should not wrap simple conditions', () => {
            expect(group('a==1')).toBe('a==1');
        });

        it('should return empty string for empty input', () => {
            expect(group('')).toBe('');
        });
    });

    describe('combineWithAnd', () => {
        it('should join conditions with semicolon', () => {
            expect(combineWithAnd(['a==1', 'b==2', 'c==3'])).toBe('a==1;b==2;c==3');
        });

        it('should filter out empty strings', () => {
            expect(combineWithAnd(['a==1', '', 'b==2', '  '])).toBe('a==1;b==2');
        });

        it('should return empty string for empty array', () => {
            expect(combineWithAnd([])).toBe('');
        });
    });

    describe('combineWithOr', () => {
        it('should join conditions with comma', () => {
            expect(combineWithOr(['a==1', 'b==2'])).toBe('a==1,b==2');
        });
    });

    describe('appendFilter', () => {
        it('should append filter to base query', () => {
            expect(appendFilter('name==test', 'status==PENDING')).toBe('name==test;status==PENDING');
        });

        it('should return filter when base is empty', () => {
            expect(appendFilter(undefined, 'status==PENDING')).toBe('status==PENDING');
            expect(appendFilter('', 'status==PENDING')).toBe('status==PENDING');
        });

        it('should return base when filter is empty', () => {
            expect(appendFilter('name==test', '')).toBe('name==test');
        });

        it('should group complex base queries', () => {
            expect(appendFilter('a==1,b==2', 'c==3')).toBe('(a==1,b==2);c==3');
        });
    });

    describe('buildQueryFromFilters', () => {
        it('should build query from filter object', () => {
            const filters = {
                name: 'test',
                status: 'PENDING',
            };
            expect(buildQueryFromFilters(filters)).toBe('name==test;status==PENDING');
        });

        it('should handle wildcard fields', () => {
            const filters = {
                name: 'test',
            };
            expect(buildQueryFromFilters(filters, { wildcardFields: ['name'] })).toBe('name==*test*');
        });

        it('should skip undefined and empty values', () => {
            const filters = {
                name: 'test',
                status: undefined,
                type: '',
            };
            expect(buildQueryFromFilters(filters)).toBe('name==test');
        });
    });
});
