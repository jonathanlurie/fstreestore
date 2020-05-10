const MAGIC = 'FTS'
const DATA_TYPE_CODE = {
  string:  'str_',
  boolean: 'bool',
  object:  'obj_',
  uint8:   'u8__',
  int8:    'i8__',
  uint16:  'u16_',
  int16:   'i16_',
  uint32:  'u32_',
  int32:   'i32_',
  uint64:  'u64_',
  int64:   'i64_',
  float32: 'f32_',
  float64: 'f64_',
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

    if (data.constructor === String) {  // data is a string
      dataBuf = new TextEncoder().encode(data).buffer
      dataType = DATA_TYPE_CODE.string
    } else if (data.constructor === Number) {  // data is a single number
      if (Number.isInteger(data)) {
        dataBuf = new BigInt64Array([BigInt(data)]).buffer
        dataType = DATA_TYPE_CODE.int64
      } else {
        dataBuf = new Float64Array([data]).buffer
        dataType = DATA_TYPE_CODE.float64
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
  static decode(buffer) {

  }
}

module.exports = FtsCodec