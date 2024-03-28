const { populateBinaryFuse8, uint64 } = require("../../lib/index.js")

const assert = require('node:assert')
const { test, describe } = require('node:test')

const NUM_KEYS = 1e6

// this is the original MID_NUM_KEYS given by the author of this test -
// https://github.com/FastFilter/xorfilter
// node.js slows down as it approaches it, and with bun node, it freezes completely on it
// see test TestBinaryFuse8Issue23
// const MID_NUM_KEYS = 11500 
const MID_NUM_KEYS_ = 11600
const NUM_TRIALS = 20

function getRandomUint64() {
  const r = () => { return BigInt(Math.abs(Math.random() * 1e16 << 0))}
  return uint64(r() * r() * 41n)
}

function TestBinaryFuse8Basic() {
  let keys = new BigUint64Array(NUM_KEYS)
  for (let i=0; i < keys.length; i++) {
    keys[i] = getRandomUint64()
  }
  const [ filter, err ] = populateBinaryFuse8(keys)
  if (err) { throw err }
  keys.forEach((key) => {
    if (!filter.contains(key)) { throw Error("filter is missing a key") }})
  
  let falsesize = 10_000
  let matches = 0 

  // calculate bits per entry and false positive rate 
  let bpv = filter.Fingerprints.length * 8.0 / NUM_KEYS
  console.log("▶ Binary Fuse8 filter: ")
  console.log("  bits per entry %s", bpv)
  for ( let i=0; i < falsesize; i++) {
    let v = getRandomUint64()
    if (filter.contains(v)) {matches++}
  }
  let fpp = matches * 100.0 / falsesize
  console.log("  false positive rate %s %", fpp)
  
  return err
}

function TestBinaryFuse8Issue23() {
  for (let trials = 0; trials < NUM_TRIALS; trials++) {
    let keys = new BigUint64Array(MID_NUM_KEYS_)
    for (let i = 0; i < MID_NUM_KEYS_; i++) {
      keys[i] = getRandomUint64()
    }
    const [ filter, err ] = populateBinaryFuse8(keys)
    if (err) { throw err }
    keys.forEach((key) => {
      if (!filter.contains(key)) { throw Error("filter is missing a key") }})
  }
  return null
}

function TestBinaryFuse8Reinit() {
  const [ filter, err ] = populateBinaryFuse8([])
  if (err) { return err }
  for (let trials = 1; trials <= NUM_TRIALS; trials++) {
    let size = MID_NUM_KEYS_
    let keys = new BigUint64Array(size) 
    for (let i = 0; i < size; i++) {
      keys[i] = getRandomUint64()
    }
    let err = filter.reInit(keys).err
    if (err) { throw err }
    if (filter.len != size) { throw Error("wrong reinit size")}
    keys.forEach((key) => {if (!filter.contains(key)) { throw Error("filter is missing a key") }})
  }
  return null
}

function Test_ZeroSet() {
  let keys = new BigUint64Array()
  return populateBinaryFuse8(keys)[1]
}

function Test_DuplicateKeysBinaryFuseDup() {
  let keys = [ 303, 1, 77, 31, 241, 303 ]
  const [ filter, err ] = populateBinaryFuse8(keys)
  if (err) { throw err }
  keys.forEach((key) => {if (!filter.contains(key)) { throw Error("filter is missing a key") }})
  if (filter.contains(-303)) { throw Error("filter is missing a key") } 
  return err
}

function Test_DuplicateKeysBinaryFuseDup_Issue30() {
  let keys = [
    14032282262966018013n,
    14032282273189634013n,
    14434670549455045197n,
    14434670549455045197n,
    14434715112030278733n,
    14434715112030278733n,
    1463031668069456414n,
    1463031668069456414n,
    15078258904550751789n,
    15081947205023144749n,
    15087793929176324909n,
    15087793929514872877n,
    15428597303557855302n,
    15431797104190473360n,
    15454853113467544134n,
    1577077805634642122n,
    15777410361767557472n,
    15907998856512513094n,
    15919978655645680696n,
    1592170445630803483n,
    15933058486048027407n,
    15933070362921612719n,
    15949859010628284683n,
    15950094057516674097n,
    15950094057516674097n,
    15950492113755294966n,
    15999960652771912055n,
    16104958339467613609n,
    16115083045828466089n,
    16115119760717288873n,
    16126347135921205846n,
    16180939948277777353n,
    16205881181578942897n,
    16207480993107654476n,
    1627916223119626716n,
    16303139460042870203n,
    16303139460042870203n,
    1630429337332308348n,
    16309304071237318790n,
    16314547479302655419n,
    16314547479302655419n,
    16369820198817029405n,
    16448390727851746333n,
    16465049428524180509n,
    16465073162513458205n,
    16465073285148156957n,
    16465073285149870384n,
    16465073285149877277n,
    16465073285893104669n,
    16555387163297522125n,
    16592146351271542115n,
    16682791020048538670n,
    16683514177871458902n,
    16699277535828137630n,
    16716099852308345174n,
    16716099868253794902n,
    16856736053711445064n,
    16856736054253850696n,
    16856736060613333064n,
    16877690937235789198n,
    16963977918744734769n,
    16976350133984177557n,
    16976376109946388059n,
    17041493382094423395n,
    17053822556128759139n,
    17067586192959011138n,
    17088637646961899303n,
    17121323146925062160n,
    17130440365429237769n,
    17130440365429237769n,
    17130440597658279433n,
    17130440597658279433n,
    17181620514756131957n,
    17193256430982721885n,
    17193256636319002973n,
    17264031033993538756n,
    17321155670529409646n,
    17514402547088160271n,
    17514402547088160271n,
    1823133498679825084n,
    1823180415377412796n,
    18278489907932484471n,
    1831024066115736252n,
    18341786752172751552n,
    18378944050902766168n,
    18378944052194427480n,
    18403514326223737719n,
    18405070344654600695n,
    2164472587301781504n,
    2164472587301781504n,
    2290190445057074187n,
    2471837983693302824n,
    2471837983693302824n,
    3138094539259513280n,
    3138094539259513280n,
    3138153989894179264n,
    3138153989894179264n,
    3566850904877432832n,
    3566850904877432832n,
    3868495676835528327n,
    3868495676835528327n,
    3981182070595518464n,
    3981182070595518464n,
    3998521163612422144n,
    3998521163612422144n,
    3998521164578160640n,
    3998521164578160640n,
    3998521164581306368n,
    3998521164581306368n,
    3998521164581329296n,
    3998521164581329296n,
    4334725363086930304n,
    4334725363086930304n,
    4337388653622853632n,
    4337388653622853632n,
    4587006656968527746n,
    4587006656968527746n,
    4587006831041087252n,
    4587006831041087252n,
    4825061103098367168n,
    4825061103098367168n
  ]
  const [ filter, err ] = populateBinaryFuse8(keys)
  if (err) { throw err }
  keys.forEach((key) => {if (!filter.contains(key)) { throw Error("filter is missing a key") }}) 
  return err
}

function Test_makeJSON_takeJSON() {
  let keys = new Array(NUM_KEYS)
  for (let i=0; i < keys.length; i++) {
    keys[i] = getRandomUint64()
  }
  const [ filter, err ] = populateBinaryFuse8(keys)
  if (err) { throw err }

  const json = filter.makeJSON()
  const [new_filter, _ ] = populateBinaryFuse8([])
  new_filter.takeJSON(json)
  keys.forEach((key) => {if (!new_filter.contains(key)) { throw Error("filter is missing a key") }}) 

  return null
}

function TestBinaryFuse8Uint32Array() {
  for (let trials = 0; trials < NUM_TRIALS; trials++) {
    let keys = new Uint32Array(MID_NUM_KEYS_)
    crypto.getRandomValues(keys)
    const [ filter, err ] = populateBinaryFuse8(keys)
    if (err) { throw err }
    keys.forEach((key) => {
      if (!filter.contains(key)) { throw Error("filter is missing a key") }})
  }
  return null
}
function TestBinaryFuse8Array_Number() {
  for (let trials = 0; trials < NUM_TRIALS; trials++) {
    let keys = new Array(MID_NUM_KEYS_)
    for (let i=0; i < keys.length; i++) {
      keys[i] = Number(getRandomUint64())
    }
    const [ filter, err ] = populateBinaryFuse8(keys)
    if (err) { throw err }
    keys.forEach((key) => {
      if (!filter.contains(key)) { throw Error("filter is missing a key") }})
  }
  return null
}
function TestBinaryFuse8Array_BigInt() {
  for (let trials = 0; trials < NUM_TRIALS; trials++) {
    let keys = new Array(MID_NUM_KEYS_)
    for (let i=0; i < keys.length; i++) {
      keys[i] = getRandomUint64()
    }
    const [ filter, err ] = populateBinaryFuse8(keys)
    if (err) { throw err }
    keys.forEach((key) => {
      if (!filter.contains(key)) { throw Error("filter is missing a key") }})
  }
  return null
}
function TestBinaryFuse8Array_NumberAndBigInt() {
  for (let trials = 0; trials < NUM_TRIALS; trials++) {
    let keys = new Array(MID_NUM_KEYS_)
    for (let i=0; i < keys.length; i++) {
      keys[i] = Math.random() > 0.5 ? getRandomUint64() : Number(getRandomUint64())
    }
    const [ filter, err ] = populateBinaryFuse8(keys)
    if (err) { throw err }
    keys.forEach((key) => {
      if (!filter.contains(key)) { throw Error("filter is missing a key") }})
  }
  return null
}


describe("Binary Fuse8 filter <test>", () => {
  test("ZeroSet_BigUint64Array(0)", () => {
    assert.strictEqual(Test_ZeroSet(), null)
  })
  test("DuplicateKeysBinaryFuseDup_number[6]", () => {
    assert.strictEqual(Test_DuplicateKeysBinaryFuseDup(), null)
  })
  test("DuplicateKeysBinaryFuseDup_Issue30_bigint[121]", () => {
    assert.strictEqual(Test_DuplicateKeysBinaryFuseDup_Issue30(), null)
  })
  test(`BinaryFuse8Issue23_BigUint64Array(${MID_NUM_KEYS_}) x ${NUM_TRIALS}`, () => {
    assert.strictEqual(TestBinaryFuse8Issue23(), null)
  })
  test(`populate+contains_BigUint64Array(${NUM_KEYS})`, () => {
    assert.strictEqual(TestBinaryFuse8Basic(), null)
  })
  test(`populate+contains+makeJSON+takeJSON_Array<bigint>(${NUM_KEYS})`, () => {
    assert.strictEqual(Test_makeJSON_takeJSON(), null)
  })
  test(`reInit_BigUint64Array(${MID_NUM_KEYS_}) x ${NUM_TRIALS}`, () => {
    assert.strictEqual(TestBinaryFuse8Reinit(), null)
  })
  test(`BinaryFuse8Uint32Array(${MID_NUM_KEYS_}) x ${NUM_TRIALS}`, () => {
    assert.strictEqual(TestBinaryFuse8Uint32Array(), null)
  })
  test(`BinaryFuse8Array<number>(${MID_NUM_KEYS_}) x ${NUM_TRIALS}`, () => {
    assert.strictEqual(TestBinaryFuse8Array_Number(), null)
  })
  test(`BinaryFuse8Array<bigint>(${MID_NUM_KEYS_}) x ${NUM_TRIALS}`, () => {
    assert.strictEqual(TestBinaryFuse8Array_BigInt(), null)
  })
  test(`BinaryFuse8Array<number | bigint>(${MID_NUM_KEYS_}) x ${NUM_TRIALS}`, () => {
    assert.strictEqual(TestBinaryFuse8Array_NumberAndBigInt(), null)
  })
}) 

