# binary-fuse-filter:   JavaScript-TypeScript module implementing binary fuse 8 filter for BigInt

This is a partial port of the
[xorfilter: Go library implementing xor and binary fuse filters](https://github.com/FastFilter/xorfilter)
Please visit them if you need more information how such ADTs work.

## General
From the original authors:

*We are assuming that your set is made of 64-bit integers. If you have strings
or other data structures, you need to hash them first to a 64-bit integer. It
is not important to have a good hash function, but collision should be unlikely
(~1/2^64). A few collisions are acceptable, but we expect that your initial set 
should have no duplicated entry.* 

The current JS-TS implementation has a false positive rate bellow 0.4% and a memory usage
of 9 bits per entry for sizeable sets.

In the original `Go` version, you construct the filter, starting from a slice of 64-bit large integers.
It returns an object of type `BinaryFuse8`. The 64-bit integers would typically be hash values of your objects.

In the `JavaScript` version we do:
```JavaScript
const bff = require('binary-fuse-filter')

const keys = [
    509134857359967859n, 
    6960900220364064023n, 
    11597439857860732537n, 
    9784652298804248601n, 
    4886430609114338934n
]

const [ filter, err ] = bff.populateBinaryFuse8(keys)
if (err) { throw err } // alternatively you can catch the err
```

And the key container can be one of the following types.

```JavaScript
type T = 
Array<bigint> | Array<number> | Array<number | bigint> | 
Uint32Array | BigUint64Array 
```
You can then query it as follows:

```JavaScript
filter.contains(509134857359967859n) // true
filter.contains(12345) // false
```
## extended API
The filter object has a few more methods:
```JavaScript
filter.makeJSON() 
// => return filter as a JavaScript Object Notation (JSON) string

filter.takeJSON(json: string) 
// consume JavaScript Object Notation (JSON) string representing the filter

filter.reInit(keys: T) 
// populate the same filter variable with new keys
```

## more
A basic 4-core Intel processor will generate, fill, and verify 1e6 random 64-bit keys in less than 2.5 seconds.
Converting the same filter built on 1e6 entries with `makeJSON()` to a string
and parsing back with `takeJSON()` takes around 100ms. 

Assuming you have cloned the project, you can run the test in the root folder. 
It is done with *Node.js'* Test runner.
```zsh
npm --test
```
The library has zero dependencies.

## install
```
npm -i binary-fuse-filter
```

