const path = require('path')
const rmfr = require('rmfr');
const fs = require('fs').promises
const FtsCodec = require('./FtsCodec')


const VALID_KEY_CHAR = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
const MAX_KEY_LENGTH = 36
const VALUE_FILE_NAME = 'value.fts'


class Store {

  constructor(path, options = {}) {
    this._path = path
  }


  async init() {
    console.log('here')
    try {
      await fs.access(this._path)
    } catch(err) {
      await fs.mkdir(this._path, {recursive: true})
    }
  }


  
  /**
   * Check that a key is valid and does not contain nasty characters
   * @param {*} key 
   */
  isValidKey (key) {
    if (key.length > MAX_KEY_LENGTH // must be not too long
    ||  key.length < 1) {           // but not too short
      return false
    }

    for (let i = 0; i < key.length; i += 1) {
      if (!VALID_KEY_CHAR.includes(key[i])) {
        console.log(key[i])
        
        return false
      }
    }
    return true
  }

  
  /**
   * Transform a key to a filesystem path by chopping the key into single letter
   * directories
   * @param {*} key 
   */
  _keyToPath (key) {
    return path.join(this._path, ...key.split(''))
  }


  /**
   * Check if this store contains a given key
   * @param {*} key 
   */
  async has (key) {
    if(!this.isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    let keyPath = this._keyToPath(key)
    let valuePath = path.join(keyPath, VALUE_FILE_NAME)

    try {
      const stat = await fs.lstat(valuePath)
      return stat.isFile()
    } catch(err) {
      return false
    }
  }

  
  async remove (key) {
    if(!this.isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    let keyPath = this._keyToPath(key)
    let valuePath = path.join(keyPath, VALUE_FILE_NAME)

    try {

      // removing the value file
      await fs.unlink(valuePath)

      let pathsToRoot = []
      for (let i = 1; i <= key.length; i += 1) {
        pathsToRoot.push(
          this._keyToPath(key.slice(0, i))
        )
      }
      // paths from the closest to the removed value up to the root
      pathsToRoot = pathsToRoot.reverse()

      // we are now deleting the branch up until its no longer a dead branch

      async function deleteBranch(paths, index) {
        const keyDirChild = await fs.readdir(paths[index], {withFileTypes: true})
        let valuableContent = keyDirChild.filter(child => (child.isDirectory() || child.name === VALUE_FILE_NAME))
        
        if (valuableContent.length === 0) {
          await rmfr(paths[index])

          if (index < paths.length - 1) {
            await deleteBranch(paths, index += 1)
          } else {
            return
          }
          
        } else {
          return
        }
      }

      await deleteBranch(pathsToRoot, 0)
      
    } catch(err) {
      console.error(err)
    }
  }


  async set (key, value) {
    if(!this.isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    let keyPath = this._keyToPath(key)
    let valuePath = path.join(keyPath, VALUE_FILE_NAME)

    // creating the key folder if it does not exist
    try {
      const stat = await fs.lstat(keyPath)
    } catch(err) {
      await fs.mkdir(keyPath, {recursive: true})
    }

    // create the value file (no matter if it exists)
    let ftsBuff = FtsCodec.encode(value)
    await fs.writeFile(valuePath, Buffer.from(ftsBuff), 'binary')
  }


  async get (key, options = {}) {
    if(!this.isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    const mustThrow = 'throw' in options ? options.throw : true

    let exists = false
    let errorMessage = ''

    let keyPath = this._keyToPath(key)
    let valuePath = path.join(keyPath, VALUE_FILE_NAME)

    try {
      const stat = await fs.lstat(valuePath)
      if (stat.isFile()) {
        exists = true
      }
    } catch(err) {
      errorMessage = `No record with the key ${key}`
    }


    if (exists) {
      let buf = new Uint8Array(await fs.readFile(valuePath)).buffer
      return FtsCodec.decode(buf, {throw: mustThrow})
    } else {
      if (mustThrow) {
        throw new Error(errorMessage)
      } else {
        return null
      }
    }
  }
}

module.exports = Store