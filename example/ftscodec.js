const fs = require('fs').promises
const Store = require('..')
const FtsCodec = Store.FtsCodec

async function main() {
  let ftsBuff = FtsCodec.encode(new Uint8Array(12, 13, 15))
  await fs.writeFile('somefile.fts', Buffer.from(ftsBuff), 'binary')
}

main()