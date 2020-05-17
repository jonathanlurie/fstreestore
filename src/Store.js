const path = require('path')
const rmfr = require('rmfr');
const fs = require('fs').promises
const FtsCodec = require('./FtsCodec')


const VALID_KEY_CHAR = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
const MAX_KEY_LENGTH = 36
const VALUE_FILE_NAME = 'value.fts'
const LISTING_FILE = 'list'
const LIST_ADD_CHAR = '>'
const LIST_REM_CHAR = '<'


class Store {

  constructor(dbPath, options = {}) {
    this._path = dbPath
    this._listPath = path.join(this._path, LISTING_FILE)
  }


  async init() {
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

    const encodedKey = encodeURIComponent(key)
    let keyPath = this._keyToPath(encodedKey)
    let valuePath = path.join(keyPath, VALUE_FILE_NAME)

    try {
      const stat = await fs.lstat(valuePath)
      return stat.isFile()
    } catch(err) {
      return false
    }
  }

  
  async _addKeyToList(key) {
    await fs.appendFile(this._listPath, `${LIST_ADD_CHAR}${key}\n`)
  }


  async _removeKeyFromList(key) {
    await fs.appendFile(this._listPath, `${LIST_REM_CHAR}${key}\n`)
  }


  async list(force = false) {
    if (force) {
      console.warn('This feature is not implemented yet')
    }

    let listFileContent = (await fs.readFile(this._listPath, 'utf8')).split('\n')
    let index = {}

    for (let i = 0; i < listFileContent.length; i += 1) {
      let line = listFileContent[i]

      if (line.length === 0) {
        continue
      }

      let insertionChar = line[0]
      let key = line.slice(1).trim()

      if (insertionChar === LIST_ADD_CHAR) {
        index[key] = true
      } else if (insertionChar === LIST_REM_CHAR) {
        delete index[key]
      }
    }

    let presentKeys = Object.keys(index)
    let newListFileContent = presentKeys.map(k => `${LIST_ADD_CHAR}${k}\n`).join('')
    await fs.writeFile(this._listPath, newListFileContent)
    return presentKeys
  }


  async remove (key) {
    if(!this.isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    const encodedKey = encodeURIComponent(key)
    let keyPath = this._keyToPath(encodedKey)
    let valuePath = path.join(keyPath, VALUE_FILE_NAME)

    try {

      // removing the value file
      await fs.unlink(valuePath)
      await this._removeKeyFromList(key)

      let pathsToRoot = []
      for (let i = 1; i <= encodedKey.length; i += 1) {
        pathsToRoot.push(
          this._keyToPath(encodedKey.slice(0, i))
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

    const encodedKey = encodeURIComponent(key)
    let keyPath = this._keyToPath(encodedKey)
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
    await this._addKeyToList(key)
  }


  async get (key, options = {}) {
    if(!this.isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    const mustThrow = 'throw' in options ? options.throw : true
    
    let exists = false
    let errorMessage = ''
    const encodedKey = encodeURIComponent(key)
    let keyPath = this._keyToPath(encodedKey)
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