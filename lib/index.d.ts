/** Composite type of available key containers
 * for the `populateBinaryFuse8(keys: T)` function.*/
export type T = Array<bigint> | Array<number> | Array<number | bigint> | Uint8Array | Uint32Array | Uint8ClampedArray | BigUint64Array;
export declare function uint64<T extends bigint | number>(x: T): bigint;
export declare function uint32<T extends bigint | number>(x: T): bigint;
export declare function uint16<T extends bigint | number>(x: T): bigint;
export declare function uint8<T extends bigint | number>(x: T): bigint;
declare class BinaryFuse8 {
    private Seed;
    private SegmentLength;
    private SegmentLengthMask;
    private SegmentCount;
    private SegmentCountLength;
    /**
     * Fingerprints marked as public to support
     * *TestBinaryFuse8Basic* from the test file.
    */
    Fingerprints: Array<number>;
    /** Holds the number of keys the filter was built with */
    len: number;
    /**
     * Return filter as a JavaScript Object Notation (JSON) string.
    */
    makeJSON(): string;
    /**
     * Consume JavaScript Object Notation (JSON) string.
     * Throw error if and only if `json` string
     * is not a valid BinaryFuse8 filter object or is corrupt.
     * Possible usage:
     * > `const [ filter,  _] = populateBinaryFuse8([])`
     * > `filter.takeJSON(json)`
     *
     * `IMPORTANT!` It *will* overwrite existing filter variable,
     * if was called not on the empty filter.
     * @param json - JSON string representing the filter object.
     * This should be the return value of `makeJSON()`.
    */
    takeJSON(json: string): void | Error;
    /**
     * Use `reInit()` to populate the same filter variable with new keys.
     * Otherwise, use the `populateBinaryFuse8()` method. This is a convenience function.
     * Possible usage:
     * > `let err = your_filter_letiable.reinit(new_set_of_keys).err`.
     * > `if (err) { throw err }`
     * @param keys T -> any set of positive integer keys
    */
    reInit(keys: T): {
        err: Error | null;
    };
    private init;
    private getHashFromHash;
    /**
     * Return `true` if filter contains the given argument key.
     * @param key -> any `number` integer or `bigint` integer.
     * Will throw a `RangeError: Not an integer` otherwise.
    */
    contains<T extends bigint | number>(key: T): boolean;
}
/**
 * Fill the filter with provided keys.
 * For best results, the caller should avoid having too many duplicated keys.
 * Possible usage:
 * > `const [ filter, err ] = populateBinaryFuse8(keys)`
 * > `if (err) { throw err }`
 * @param keys -> any set of positive integer keys
*/
export declare function populateBinaryFuse8(keys: T): [BinaryFuse8, Error | null];
export {};
