const Store = require('..')
const FtsCodec = Store.FtsCodec



let s = new Store('myStore01')
// console.log(s.isValidKey('tdlqj-dlj767-665yu'))

async function main() {
  await s.init()
  
  console.time('c')
  // await s.set('some_key', 'all right')
  // await s.set('some_other_key', 'all right0')
  // await s.set('some', 'all right2')
  // console.log(await s.get('some_key'))
  await s.remove('some_other_key')
  
  // console.log('has some_other_', await s.has('some_other_'));
  console.timeEnd('c')
}

main()