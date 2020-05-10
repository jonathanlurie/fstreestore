const fs = require('fs').promises
const Store = require('..')
const FtsCodec = Store.FtsCodec

async function main() {
  let ftsBuff = FtsCodec.encode(null) // TODO: deal with the null case
  await fs.writeFile('somefile.fts', Buffer.from(ftsBuff), 'binary')
  let buf = new Uint8Array(await fs.readFile('somefile.fts')).buffer
  let value = FtsCodec.decode(buf, {throw: true})
  console.log('value', value)
  
}

main()