const { performance } = require('perf_hooks')
const Store = require('..')
const FtsCodec = Store.FtsCodec

function randStr(length) {
  var result           = ''
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

// let s = new Store('myStore02')
let s = new Store('/Users/lurie/Desktop/some_folder')



async function benchmark(iterations = 100) {
  await s.init()
  let keys = Array.apply(null, {length: iterations}).map(Number.call, Number).map(x => `some_key_${x}`)
  let values = Array.apply(null, {length: iterations}).map(x => randStr(200))
  // let values = Array.apply(null, {length: iterations}).map(x => {
  //   return new Float32Array(
  //     Array.apply(null, {length: ~~(Math.random() * 1000)}).map(x => Math.random() * 1000)
  //   )
  // })
  
  // SET
  let t0 = performance.now()
  for (let i = 0; i < iterations; i += 1) {
    await s.set(keys[i], values[i])
  }
  let t1 = performance.now()
  let t = t1 - t0
  let ops = ~~(iterations / (t / 1000) )
  console.log('CREATE time (ms):', t, '  iterations:', iterations, ' ops:', ops)

  // GET
  t0 = performance.now()
  for (let i = 0; i < iterations; i += 1) {
    let val = await s.get(keys[i])
  }
  t1 = performance.now()
  t = t1 - t0
  ops = ~~(iterations / (t / 1000) )
  console.log('READ time (ms):', t, '  iterations:', iterations, ' ops:', ops)

  // REMOVE
  t0 = performance.now()
  for (let i = 0; i < iterations; i += 1) {
    await s.remove(keys[i])
  }
  t1 = performance.now()
  t = t1 - t0
  ops = ~~(iterations / (t / 1000) )
  console.log('DELETE time (ms):', t, '  iterations:', iterations, ' ops:', ops)
  
  // LIST
  let presentKeys = await s.list()
  console.log('presentKeys', presentKeys)
  
}

benchmark(10)