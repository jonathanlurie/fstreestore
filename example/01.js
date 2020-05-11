const Store = require('..')
const FtsCodec = Store.FtsCodec



let s = new Store('myStore01')
// console.log(s.isValidKey('tdlqj-dlj767-665yu'))

async function main() {
  await s.init()
  
  console.time('c')
  await s.set('a', 'all right')
  await s.set('b', 'all right')
  // await s.set('some_other_key', 'all right0')
  // await s.set('some', 'all right2')
  // console.log(await s.get('some_key'))
  await s.remove('a')
  await s.remove('b')
  
  // console.log('has some_other_', await s.has('some_other_'));
  console.timeEnd('c')
}

main()