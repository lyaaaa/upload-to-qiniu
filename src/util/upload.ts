const qiniu = require('qiniu')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminJpegtran = require('imagemin-jpegtran')
import { getBufferFromFile, bufferToStream } from './base'

// 获取七牛token
const getToken = (accessKey: string, secretKey: string, scope: string) => {
  const options = {
    scope,
  }
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
  const putPolicy = new qiniu.rs.PutPolicy(options)
  const uploadToken = putPolicy.uploadToken(mac)
  return uploadToken
}

// 七牛上传配置
export interface QiNiuUpConfig {
  domain: string // 上传后域名
  accessKey: string // 七牛参数
  secretKey: string // 七牛参数
  scope: string // 七牛上传空间
  gzip: boolean // 是否需要压缩
}

export const upImageToQiniu = async (
  loaclFile: string,
  cb: { (res: any): void; (arg0: any): void },
  upConfig: QiNiuUpConfig
) => {
  const config = new qiniu.conf.Config()
  const formUploader = new qiniu.form_up.FormUploader(config)
  const putExtra = new qiniu.form_up.PutExtra()
  const token = getToken(upConfig.accessKey, upConfig.secretKey, upConfig.scope)
  let gzipImage
  if (upConfig.gzip) {
    gzipImage = await imageGzip(loaclFile)
  }
  // 获取当前时间戳
  var key = new Date().getTime()
  // 上传调用方法
  const uploadFnName = gzipImage ? 'putStream' : 'putFile'
  // 上传内容
  const uploadItem = gzipImage ? bufferToStream(gzipImage) : loaclFile
  // 七牛上传
  formUploader[uploadFnName](
    token,
    key,
    uploadItem,
    putExtra,
    function (respErr: any, respBody: any, respInfo: any) {
      if (respErr) {
        throw respErr
      }

      if (respInfo.statusCode === 200) {
        const url = upConfig.domain + '/' + respBody.key
        cb(url)
      }
    }
  )
}

const imageGzip = async (loaclFile: string): Promise<any> => {
  const bufferFile = await getBufferFromFile(loaclFile)
  let res
  try {
    res = await imagemin.buffer(bufferFile, {
      plugins: [
        imageminJpegtran(),
        imageminPngquant({
          quality: [0.6, 0.8],
        }),
      ],
    })
  } catch (err) {
    res = null
  }
  return res
}
