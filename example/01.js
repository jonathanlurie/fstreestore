const Store = require('..')

let s = new Store('myStore01')
// console.log(s.isValidKey('tdlqj-dlj767-665yu'))

async function main() {
  await s.init()
}

main()