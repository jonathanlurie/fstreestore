# FSTREESTORE
FSTREESTORE is a *key-value* store that relies entirely on the filesystem and file/folder tree structure. No server.

Here are some features:
- Entirely based on the filesystem
- Five simple operations: `has`, `set`, `get`, `remove`, `list`
- Fast listing with indexing and self sanitizing
- No server required
- A database is just a folder (easy backup, migrate, delete)
- Need multiple stores? Just instanciate multiple `Store` on different folders
- No low-level dependencies
- OK fast
- Keys can contain any utf-8 characters (emoji, Chinese, etc.) and as long as 36 characters
- Values can be `null`, *String*, *Number*, *Array*, *Object*, *TypedArray* (including BigInt and Float64) and *Boolean*
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
let s = new Store('/somewhere/on/filesystem/myDb')

// All the functions are asynchronous and return promises, so they need to be called
// with 'await' from an 'async' function (or with '.then() and .catch())
async function main() {
  // Create the provided directory if necessary
  await s.init()
  
  // ** Store a key-value 

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

  // with null
  await s.set('a-key-09', null)


  // ** Retrieve/get a value, under the type they were saved

  let val02 = await s.get('a-key-02') // 42 --> number
  let val07 = await s.get('a-key-07') // Float64Array([12.5, 13.3, 14]) --> typed array
  let val04 = await s.set('a-key-04') // {firstname: 'Johnny', lastname: 'Bravo'} --> object


  // ** List all the available keys

  let allKeys = await s.list()


  // ** remove data, using the key

  await s.remove('a-key-02') 
}

main()
```

# Key format
The only constraint for the keys is that they are at least 1 character long and at most 36. Apart from that, all the utf-8 charaters are possible, including emojis, accentuated, Chinese, etc.

Example:
```js
await s.set('drum 🥁', new Float32Array([12, 34.34, Math.PI]))
```

# A word on Errors
FSTREESTORE will throw errors if the provided key does not respect (empty string or longer than 36 characters).

In addition, the `.get()` will throw an error if the key is not existing. To prevent `get` from thowing, it must be used as follow `.get('some key', {throw: false})`, then a `null` value will be returned if `'some key'` does not exist.

# Listing and precautions
Since FSTREESTORE's database are entirely based on the filesystem, it makes all the data easily accessible, but the files and folder in there are to be accessed only by FSTREESTORE and should not be modified manually, otherwise the whole DB might get corrupted.

This is particularly true for the `list` file, that makes the listing possible in a reasonable amount of time. This file keeps an index of what is added and removed. Every time `.list()` is called, the list file gets sanitized under the hood, removing duplicates and deleted keys to keep only the remaining keys. The list is automatically sanitized every 5000 set/remove operations.

# Compatibility
FSTREESTORE was developed and tested on MacOS and probably works on Linux. It was not tested on Windows and I am pretty sure it would not work due to the Windows filesystem being very different from Unix-like fs.

# Why?
The idea first came when I started to look for a *key-value* store that I could run close to a Nodejs app, that did not require a server and was fast and versatile enough. I stumbled upon the excellent **LMDB** (and its [Node wrapper](https://www.npmjs.com/package/node-lmdb)) and started playing with it. Then I wondered how it was working under the hood and looked up B+ trees and stuff like that, and even though **FSTREESTORE** does not use a B+ tree, it's still loosely inspired by this concept. Also, not relying on low level dependencies can prevent having some plateform issues.  
Finally, the main reason is that it was fun to to and I was curious about the performance of such a naive store implementation.

# Performance
In the first part, performances were said to be "OK fast", this is obviously relative to one's habit and expectation (as well as one's configuration). In other word, let's just say it's a hobby store that is tailords for hobby projects, and it costs zero in DB server money.
```
CREATE time (ms): 822.414488017559   iterations: 1000  ops: 1215
READ time (ms): 372.39405900239944   iterations: 1000  ops: 2685
DELETE time (ms): 651.8716329932213   iterations: 1000  ops: 1534
```

Obviously, these are nowhere near the ~50000 operations per seconds (ops) I get with `LMDB` in the same conditions, but I knew since the very begining that I would never be even close with such a naive approach that relies entirely on creating folders and files on the filesystem!