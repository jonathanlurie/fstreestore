const MAGIC = 'FTS'
const DATA_TYPE_CODE = { // they must all be of the same length
  string:   'str__',
  boolean:  'bool_',
  object:   'obj__',
  uint8:    'u8___',
  int8:     'i8___',
  uint16:   'u16__',
  int16:    'i16__',
  uint32:   'u32__',
  int32:    'i32__',
  uint64:   'u64__',
  int64:    'i64__',
  int64s:   'i64s_', // the ending 's' stands for 'single number
  float32:  'f32__',
  float64:  'f64__',
  float64s: 'f64s_', // the ending 's' stands for 'single number
}

const TYPED_ARRAY_CONSTRUCTORS = [
  Uint8Array,
  Int8Array,
  Uint8Array,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  BigInt64Array,
  BigUint64Array,
  Float32Array,
  Float64Array,
]

const DATA_BYTE_OFFSET = MAGIC.length + DATA_TYPE_CODE.string.length


/**
 * Fts stands for Filesystem Tree Store. It is a simple binary format
 * for serializing simple data such as string, numbers, arrays of numbers and objects.
 */
class FtsCodec {

  /**
   * Encode a piece of data into a Fts buffer. Returns an ArrayBuffer
   * @param {*} data 
   */
  static encode(data, options = {}) {
    let dataBuf = null
    let dataType = null

    // dealing with different kinds of data types...
    if (data.constructor === String) {  // data is a string
      dataBuf = new TextEncoder().encode(data).buffer
      dataType = DATA_TYPE_CODE.string
    } else if (data.constructor === Number) {  // data is a single number
      if (Number.isInteger(data)) {
        dataBuf = new BigInt64Array([BigInt(data)]).buffer
        dataType = DATA_TYPE_CODE.int64s
      } else {
        dataBuf = new Float64Array([data]).buffer
        dataType = DATA_TYPE_CODE.float64s
      }
    } else if (data.constructor === Boolean) { // data is a boolean
      dataBuf = new Uint8Array([+data])
      dataType = DATA_TYPE_CODE.boolean
    } else if (data.constructor === Uint8Array) { // data is a Uint8Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.uint8
    } else if (data.constructor === Uint16Array) { // data is a Uint16Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.uint16
    } else if (data.constructor === Uint32Array) { // data is a Uint32Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.uint32
    } else if (data.constructor === BigUint64Array) { // data is a BigUint64Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.uint64
    } else if (data.constructor === Int8Array) { // data is a Int8Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.int8
    } else if (data.constructor === Int16Array) { // data is a Int16Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.int16
    } else if (data.constructor === Int32Array) { // data is a Int32Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.int32
    } else if (data.constructor === BigInt64Array) { // data is a BigInt64Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.int64
    } else if (data.constructor === Float32Array) { // data is a Float32Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.float32
    } else if (data.constructor === Float64Array) { // data is a Float64Array
      dataBuf = data.buffer
      dataType = DATA_TYPE_CODE.float64
    } else if (Array.isArray(data) || data.constructor === Object) {
      dataBuf = new TextEncoder().encode(JSON.stringify(data)).buffer
      dataType = DATA_TYPE_CODE.object
    }

    // building the final buffer (ArrayBuffer)
    const magicBuff = new TextEncoder().encode(MAGIC).buffer
    const dataTypeBuff = new TextEncoder().encode(dataType).buffer
    const totalBuffByteSize = magicBuff.byteLength + dataTypeBuff.byteLength + dataBuf.byteLength
    const FtsBuffer = new Uint8Array(totalBuffByteSize)
    FtsBuffer.set(new Uint8Array(magicBuff), 0)
    FtsBuffer.set(new Uint8Array(dataTypeBuff), magicBuff.byteLength)
    FtsBuffer.set(new Uint8Array(dataBuf), magicBuff.byteLength + dataTypeBuff.byteLength)
    
    return FtsBuffer.buffer
  }


  /**
   * Decode the buffer of a Fts into a piece of data
   * @param {*} buffer 
   */
  static decode(buffer, options = {}) {
    let mustThrow = 'throw' in options ? options.throw : false
    
    // The buffer must be at least the size of the magic number + the size of the data type code.
    // Note: if data is empty (an empty typed array or an empty string was encded) it's a bit
    // of a pain but we kinda have to deal with this case...
    const dataByteLength = buffer.byteLength - DATA_BYTE_OFFSET
    if (dataByteLength < 0) {
      if (mustThrow) {
        throw new Error('Invalid FTS file.')
      } else {
        return null
      }
    }

    // Getting the magic number
    if (new TextDecoder().decode(new Uint8Array(buffer, 0, MAGIC.length)) !== MAGIC) {
      if (mustThrow) {
        throw new Error('Invalid FTS file.')
      } else {
        return null
      }
    }

    // get the data type
    const dataType = new TextDecoder().decode(new Uint8Array(buffer, MAGIC.length, DATA_TYPE_CODE.string.length))
    
    if (!(Object.values(DATA_TYPE_CODE).includes(dataType))) {
      if (mustThrow) {
        throw new Error('Unrecognized data type for this FTS file.')
      } else {
        return null
      }
    }

    // deal with all the cases
    if (dataType === DATA_TYPE_CODE.string) {
      if (dataByteLength === 0) {
        return ''
      } else {
        return new TextDecoder().decode(new Uint8Array(buffer, DATA_BYTE_OFFSET))
      }
    
    } else if (dataType === DATA_TYPE_CODE.boolean) {
      return !!(new Uint8Array(buffer, DATA_BYTE_OFFSET)[0])
    } else if (dataType === DATA_TYPE_CODE.object) {
      return JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, DATA_BYTE_OFFSET)))
    } else if (dataType === DATA_TYPE_CODE.uint8) {
      return new Uint8Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.int8) {
      return new Int8Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.uint16) {
      return new Uint16Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.int16) {
      return new Int16Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.uint32) {
      return new Uint32Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.int32) {
      return new Int32Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.float32) {
      return new Float32Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.float64) {
      return new Float64Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.float64s) {
      return new Float64Array(buffer, DATA_BYTE_OFFSET)[0]
    } else if (dataType === DATA_TYPE_CODE.uint64) {
      return new BigUint64Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.int64) {
      return new BigInt64Array(buffer, DATA_BYTE_OFFSET)
    } else if (dataType === DATA_TYPE_CODE.int64s) {
      return Number(new BigInt64Array(buffer, DATA_BYTE_OFFSET)[0])
    }


  }
}

module.exports = FtsCodec