const path = require('path')
// const fs = require('promise-fs')
const fs = require('fs').promises


const VALID_KEY_CHAR = 'abcdefghijklmnopqstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
const MAX_KEY_LENGTH = 36
const VALUE_FILE_NAME = 'value.fts'

class Store {

  constructor(path, options = {}) {
    this._path = path
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

    for (let i = 0; i < key.length; i += 1) {
      if (!VALID_KEY_CHAR.includes(key[i])) {
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
    if(!isValidKey(key)) {
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
    if(!isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    let keyPath = this._keyToPath(key)
    let valuePath = path.join(keyPath, VALUE_FILE_NAME)

    try {
      await fs.unlink(valuePath)

      // then, we must check if there are other sub dirs in the key dir
      // (keys that would start with the same string)
      // if so, we don't do any additional task, if not, we have to delete this branch of the
      // tree up to the place where there are other values.
      const keyDirChild = await fs.readDir(keyPath, {withFileTypes: true})
      let dirChildren = keyDirChild.filter(child => child.isDirectory())
      if(dirChildren.length === 0) {
        // TODO: delete the branch here
      }
    } catch(err) {}
  }




  async put (key, value) {
    if(!isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    let keyPath = this._keyToPath(key)
  }


  async get (key) {
    if(!isValidKey(key)) {
      throw new Error(`The key must contain only alphanumeric, dash and underscore characters. The length cannot be greater than ${MAX_KEY_LENGTH}. The key ${VALUE_FILE_NAME} is reserved.`)
    }

    let keyPath = this._keyToPath(key)
  }
}

module.exports = Store