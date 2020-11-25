const fs = require('fs')
const duplex = require('stream').Duplex

// 获取buffer
export const getBufferFromFile = (filePath: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, function (err: any, res: any) {
      if (!err) {
        resolve(res)
      }
    })
  })
}

// buffer 转 stream
export const bufferToStream = (buffer: Buffer) => {
  let stream = new duplex()
  stream.push(buffer)
  stream.push(null)
  return stream
}
