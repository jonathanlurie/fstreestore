# FSTREESTORE
Filesystem-Tree-Store is a naive hobby *key-value* store.  

Here are some features:
- Entirely based on the filesystem
- Four operations: `has`, `set`, `get`, `remove`
- No server required
- A database is just a folder
- Need multiple stores? Just instanciate multiple `Store` on different folders
- No low-level dependencies
- OK fast
- Keys must be strings of length [1-36] with alphanumeric, dashes and underscores
- Values can be *String*, *Number*, *Array*, *Object*, *TypedArray* (including BigInt and Float64) and *Boolean*
- Numerical values are automatically saved as float or int on 64 bits. Strings are utf-8
- Serialization file format is efficient, versatile and simple

# Install
```
npm install fstreestore
```

# Usage
```js
const Store = require('fstreestore')

// A diretory path is expected here. Can be absolute or relative
let s = new Store('myStore')

async function main() {
  // Create the provided directory if necessary
  await s.init()
  
  // ** Store/set a value

  // with a string
  await s.set('a-key', 'a value')

  // with a number (serialized as int64)
  await s.set('a-key-02', 42)

  // with a number (serialized as float64)
  await s.set('a-key-03', 42.42)

  // with an Object (serialized as JSON string, utf-8)
  await s.set('a-key-04', {firstname: 'Johnny', lastname: 'Bravo'})

  // with an (untyped) Array (serialized as JSON string, utf-8)
  await s.set('a-key-05', [42, 'Johnny Bravo', {foo: 'bar'}])
  
  // with a typed array (all flavours are possible)
  await s.set('a-key-06', new Uin32Array([12, 13, 14]))
  await s.set('a-key-07', new Float64Array([12.5, 13.3, 14]))

  // with boolean
  await s.set('a-key-08', true)


  // ** Retrieve/get a value, under the type they were saved

  let val = await s.get('a-key-02')) // 42
  let val02 = await s.get('a-key-07')) // Float64Array([12.5, 13.3, 14])

  // ** Retrieve/get a value TODO: CONTINUE

  await s.remove('a')
  await s.remove('b')
  
  // console.log('has some_other_', await s.has('some_other_'));
  console.timeEnd('c')
}

main()
```

TODO: doc about throw!

# Why?
The idea first came when I started to look for a *key-value* store that I could run close to a Nodejs app, that did not require a server and was fast and versatile enough. I stumble upon the excelent **LMDB** (and its [Node wrapper](https://www.npmjs.com/package/node-lmdb)) and started playing with it. Then I wondered how it was working under the hood and looked up B+ trees and stuff like that, and even though **FSTREESTORE** does not use a B+ tree, it's still loosely inspired by this concept. Also, not relying on low level dependencies can prevent having some plateform issues.  
Finally, the main reason is that it was fun to to and I was curious about the performance of such a naive store implementation.

# Performance
In the first part, performances were said to be "OK fast", this is obviously relative to one's habit and expectation (as well as one's configuration). In other word, let's just say it's a hobby store that is tailords for hobby projects, and it costs zero in DB server money.
```
CREATE time (ms): 822.414488017559   iterations: 1000  ops: 1215
READ time (ms): 372.39405900239944   iterations: 1000  ops: 2685
DELETE time (ms): 651.8716329932213   iterations: 1000  ops: 1534
```

Obviously, these are nowhere near the ~50000 operations per seconds (ops) I get with `LMDB` in the same conditions, but I knew since the very begining that I would never be even close with such a naive approach that relies entirely on creating hundreds of files on the filesystem!