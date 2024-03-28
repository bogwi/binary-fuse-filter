"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateBinaryFuse8 = exports.uint8 = exports.uint16 = exports.uint32 = exports.uint64 = void 0;
require('./bigIntToJSON');
function uint64(x) {
    return BigInt.asUintN(64, BigInt(x));
}
exports.uint64 = uint64;
function uint32(x) {
    return BigInt.asUintN(32, BigInt(x));
}
exports.uint32 = uint32;
function uint16(x) {
    return BigInt.asUintN(16, BigInt(x));
}
exports.uint16 = uint16;
function uint8(x) {
    return BigInt.asUintN(8, BigInt(x));
}
exports.uint8 = uint8;
let MaxIterations = 1024;
class BinaryFuse8 {
    /**
     * Return filter as a JavaScript Object Notation (JSON) string.
    */
    makeJSON() {
        return JSON.stringify(this);
    }
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
    takeJSON(json) {
        // check object type
        const [prototype, _] = populateBinaryFuse8([]);
        const filter = JSON.parse(json);
        if (typeof filter !== typeof prototype) {
            throw new Error("json string is not a BinaryFuse8 filter object or is corrupted");
        }
        // assign fields
        this.Seed = BigInt(filter.Seed);
        this.SegmentLength = filter.SegmentLength;
        this.SegmentLengthMask = filter.SegmentLengthMask;
        this.SegmentCount = filter.SegmentCount;
        this.SegmentCountLength = filter.SegmentCountLength;
        this.len = filter.len;
        this.Fingerprints = filter.Fingerprints;
    }
    /**
     * Use `reInit()` to populate the same filter variable with new keys.
     * Otherwise, use the `populateBinaryFuse8()` method. This is a convenience function.
     * Possible usage:
     * > `let err = your_filter_letiable.reinit(new_set_of_keys).err`.
     * > `if (err) { throw err }`
     * @param keys T -> any set of positive integer keys
    */
    reInit(keys) {
        let err = this.init(keys)[1];
        return { err };
    }
    init(keys) {
        let size = keys.length;
        this.len = size;
        let arity = 3;
        this.SegmentLength = calculateSegmentLength(arity, size);
        if (this.SegmentLength > 262144) {
            this.SegmentLength = 262144;
        }
        this.SegmentLengthMask = this.SegmentLength - 1;
        let sizeFactor = calculateSizeFactor(arity, size);
        let capacity_ = 0;
        if (size > 1) {
            capacity_ = Math.round(size * sizeFactor);
        }
        let initSegmentCount = Number(uint32(Math.floor((capacity_ + this.SegmentLength - 1)
            / this.SegmentLength - (arity - 1))));
        let arrayLength = Number(uint32((initSegmentCount + arity - 1) * this.SegmentLength));
        this.SegmentCount = Number(uint32(Math.floor((arrayLength + this.SegmentLength - 1)
            / this.SegmentLength)));
        if (this.SegmentCount <= arity - 1) {
            this.SegmentCount = 1;
        }
        else {
            this.SegmentCount = this.SegmentCount - (arity - 1);
        }
        arrayLength = (this.SegmentCount + arity - 1) * this.SegmentLength;
        this.SegmentCountLength = this.SegmentCount * this.SegmentLength;
        this.Fingerprints = new Array(arrayLength).fill(0);
        let rngcounter = uint64(1);
        const split_mix = splitmix64(rngcounter);
        this.Seed = split_mix.z;
        rngcounter = split_mix.seed;
        let capacity = this.Fingerprints.length;
        let alone = new Uint32Array(capacity);
        let t2count = new Uint8Array(capacity);
        let reverseH = new Uint8Array(size);
        let t2hash = new BigUint64Array(capacity);
        let reverseOrder = new BigUint64Array(size + 1);
        reverseOrder[size] = 1n;
        let h123 = Array(6);
        let iterations = 0;
        while (true) {
            iterations += 1;
            if (iterations > MaxIterations) {
                const err = new Error("too many iterations");
                let filter = this;
                return [filter, err];
            }
            let blockBits = 1n;
            while ((1n << blockBits) < this.SegmentCount) {
                blockBits += 1n;
            }
            let startPos = new BigUint64Array(Number(1n << blockBits));
            for (let i = uint64(0); i < startPos.length; i++) {
                startPos[Number(i)] = i * uint64(size) >> blockBits;
            }
            for (let i = 0; i < keys.length; i++) {
                let hash = mixsplit(keys[i], this.Seed);
                let segment_index = hash >> (64n - blockBits);
                while (reverseOrder[Number(startPos[Number(segment_index)])] != 0n) {
                    segment_index++;
                    segment_index &= (1n << blockBits) - 1n;
                }
                reverseOrder[Number(startPos[Number(segment_index)])] = hash;
                startPos[Number(segment_index)] += 1n;
            }
            let error = 0;
            let duplicates = 0;
            for (let i = 0; i < size; i++) {
                let hash = reverseOrder[i];
                const { h1, h2, h3 } = this.getHashFromHash(hash);
                t2count[h1] += 4;
                t2hash[h1] ^= hash;
                t2count[h2] += 4;
                t2count[h2] ^= 1;
                t2hash[h2] ^= hash;
                t2count[h3] += 4;
                t2count[h3] ^= 2;
                t2hash[h3] ^= hash;
                // If we have duplicated hash values, then it is likely that
                // the next comparison is true
                if ((t2hash[h1] & t2hash[h2] & t2hash[h3]) == 0n) {
                    // next we do the actual test
                    if (((t2hash[h1] == 0n) && (t2count[h1] == 8))
                        || ((t2hash[h2] == 0n) && (t2count[h2] == 8))
                        || ((t2hash[h3] == 0n) && (t2count[h3] == 8))) {
                        duplicates += 1;
                        t2count[h1] -= 4;
                        t2hash[h1] ^= hash;
                        t2count[h2] -= 4;
                        t2count[h2] ^= 1;
                        t2hash[h2] ^= hash;
                        t2count[h3] -= 4;
                        t2count[h3] ^= 2;
                        t2hash[h3] ^= hash;
                    }
                }
                if (t2count[h1] < 4) {
                    error = 1;
                }
                if (t2count[h2] < 4) {
                    error = 1;
                }
                if (t2count[h3] < 4) {
                    error = 1;
                }
            }
            if (error === 1) {
                for (let i = 0; i < size; i++) {
                    reverseOrder[i] = 0n;
                }
                for (let i = 0; i < capacity; i++) {
                    t2count[i] = 0;
                    t2hash[i] = 0n;
                }
                const split_mix = splitmix64(rngcounter);
                this.Seed = split_mix.z;
                rngcounter = split_mix.seed;
                continue;
            }
            // End of key addition
            let Qsize = 0;
            for (let i = 0; i < capacity; i++) {
                alone[Qsize] = i;
                if ((t2count[i] >> 2) === 1) {
                    Qsize++;
                }
            }
            let stacksize = 0;
            while (Qsize > 0) {
                Qsize--;
                let index = Number(alone[Qsize]);
                if ((t2count[index] >> 2) === 1) {
                    let hash = t2hash[index];
                    let found = t2count[index] & 3;
                    reverseH[stacksize] = found;
                    reverseOrder[stacksize] = hash;
                    stacksize++;
                    const { h1, h2, h3 } = this.getHashFromHash(hash);
                    h123[1] = h2;
                    h123[2] = h3;
                    h123[3] = h1;
                    h123[4] = h123[1];
                    let other_index1 = h123[found + 1];
                    alone[Qsize] = other_index1;
                    if ((t2count[other_index1] >> 2) === 2) {
                        Qsize++;
                    }
                    t2count[other_index1] -= 4;
                    t2count[other_index1] ^= mod3(found + 1);
                    t2hash[other_index1] ^= hash;
                    let other_index2 = h123[found + 2];
                    alone[Qsize] = other_index2;
                    if ((t2count[other_index2] >> 2) === 2) {
                        Qsize++;
                    }
                    t2count[other_index2] -= 4;
                    t2count[other_index2] ^= mod3(found + 2);
                    t2hash[other_index2] ^= hash;
                }
            }
            if (stacksize + duplicates === size) {
                // Success
                break;
            }
            else if (duplicates > 0) {
                // Duplicates were found, but we did not
                // manage to remove them all. We may simply sort the key to
                // solve the issue. This will run in time O(n log n) and it
                // mutates the input.
                keys = pruneDuplicates(keys);
            }
            for (let i = 0; i < size; i++) {
                reverseOrder[i] = 0n;
            }
            for (let i = 0; i < capacity; i++) {
                t2count[i] = 0;
                t2hash[i] = 0n;
            }
            const split_mix = splitmix64(rngcounter);
            this.Seed = split_mix.z;
            rngcounter = split_mix.seed;
        } // END main for loop
        if (size === 0) {
            let err = null;
            let filter = this;
            return [filter, err];
        }
        for (let i = (size - 1); i >= 0; i--) {
            // the hash of the key we insert next
            let hash = reverseOrder[i];
            let xor2 = uint8(fingerprint(hash));
            const { h1, h2, h3 } = this.getHashFromHash(hash);
            let found = reverseH[i];
            h123[0] = h1;
            h123[1] = h2;
            h123[2] = h3;
            h123[3] = h123[0];
            h123[4] = h123[1];
            this.Fingerprints[h123[found]] = Number(xor2
                ^ uint8(this.Fingerprints[h123[found + 1]])
                ^ uint8(this.Fingerprints[h123[found + 2]]));
        }
        let err = null;
        let filter = this;
        return [filter, err];
    }
    getHashFromHash(hash) {
        let hi = uint32(Mul64hi(hash, uint64(this.SegmentCountLength)).hi);
        let sL = uint32(this.SegmentLength);
        let sLm = uint32(this.SegmentLengthMask);
        let h1_ = hi;
        let h2_ = h1_ + sL;
        let h3_ = h2_ + sL;
        h2_ ^= hash >> 18n & sLm;
        h3_ ^= hash & sLm;
        return { h1: Number(h1_), h2: Number(h2_), h3: Number(h3_) };
    }
    /**
     * Return `true` if filter contains the given argument key.
     * @param key -> any `number` integer or `bigint` integer.
     * Will throw a `RangeError: Not an integer` otherwise.
    */
    contains(key) {
        let hash = mixsplit(uint64(key), this.Seed);
        let f = uint8(fingerprint(hash));
        const { h1, h2, h3 } = this.getHashFromHash(hash);
        f ^= uint8(this.Fingerprints[h1] ^ this.Fingerprints[h2] ^ this.Fingerprints[h3]);
        return f == 0n;
    }
}
function murmur64(h) {
    h ^= h >> 33n;
    h = uint64(h * 0xff51afd7ed558ccdn);
    h ^= h >> 33n;
    h = uint64(h * 0xc4ceb9fe1a85ec53n);
    h ^= h >> 33n;
    return h;
}
function splitmix64(seed) {
    seed = uint64(seed + 0x9e3779b97f4a7c15n);
    let z = seed;
    z = uint64((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n);
    z = uint64((z ^ (z >> 27n)) * 0x94d049bb133111ebn);
    z = uint64(z ^ (z >> 31n));
    return { seed, z };
}
function mixsplit(key, seed) {
    return murmur64(uint64(uint64(key) + uint64(seed)));
}
function fingerprint(hash) {
    return hash ^ (hash >> 32n);
}
function pruneDuplicates(array) {
    array.sort((a, b) => Number(a) - Number(b));
    let pos = 0;
    for (let i = 1; i < array.length; i++) {
        if (array[i] !== array[pos]) {
            array[pos + 1] = array[i];
            pos += 1;
        }
    }
    return array;
}
function Mul64hi(x, y) {
    // Since we are dealing with bigint, 
    // we can extract the hi part of the multiplication with less effort.
    let hi = (x * y) >> 64n;
    // const mask32 = (1n << 32n) - 1n;
    // let x0 = x & mask32 
    // let x1 = x >> 32n
    // let y0 = y & mask32
    // let y1 = y >> 32n
    // let w0 = x0 * y0
    // let t = x1*y0 + (w0 >> 32n)
    // let w1 = t & mask32
    // let w2 = t >> 32n
    // w1 = w1 + x0 * y1 
    // let hi = x1*y1 + w2 + (w1 >> 32n)
    // // let lo = uint64(x * y)
    return { hi };
}
function calculateSizeFactor(arity, size) {
    if (arity === 3) {
        return Math.max(1.125, 0.875 + 0.25 * Math.log(1000000) / Math.log(size));
    }
    else if (arity === 4) {
        return Math.max(1.075, 0.77 + 0.305 * Math.log(600000) / Math.log(size));
    }
    else
        return 2.0;
}
function calculateSegmentLength(arity, size) {
    if (size === 0) {
        return 4;
    }
    if (arity === 3) {
        return Number(uint32(1) <<
            BigInt(Math.floor(Math.log(size) / Math.log(3.33) + 2.25)));
    }
    else if (arity === 4) {
        return Number(uint32(1) <<
            BigInt(Math.floor(Math.log(size) / Math.log(2.91) - 0.5)));
    }
    else
        return 65536;
}
function mod3(x) {
    let x_ = BigInt.asUintN(8, BigInt(x));
    if (x_ > 2) {
        x_ -= 3n;
    }
    return Number(x_);
}
/**
 * Fill the filter with provided keys.
 * For best results, the caller should avoid having too many duplicated keys.
 * Possible usage:
 * > `const [ filter, err ] = populateBinaryFuse8(keys)`
 * > `if (err) { throw err }`
 * @param keys -> any set of positive integer keys
*/
function populateBinaryFuse8(keys) {
    let filter = new BinaryFuse8();
    let err = filter.reInit(keys).err;
    return [filter, err];
}
exports.populateBinaryFuse8 = populateBinaryFuse8;
