const path = require('path')
const qiniu = require('qiniu')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminJpegtran = require('imagemin-jpegtran')
const fs = require('fs')
const FormData = require('form-data')
const axios = require('axios')
import * as vscode from 'vscode'
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
  localFile: string,
  cb: { (res: any): void; (arg0: any): void },
  upConfig: QiNiuUpConfig
) => {
  // 将图片路径统一为 xx/xxx
  const filePathArr = localFile.split(path.sep)
  localFile = path.posix.join(...filePathArr)

  const config = new qiniu.conf.Config()
  const formUploader = new qiniu.form_up.FormUploader(config)
  const putExtra = new qiniu.form_up.PutExtra()
  const token = getToken(upConfig.accessKey, upConfig.secretKey, upConfig.scope)
  let gzipImage
  if (upConfig.gzip) {
    gzipImage = await imageGzip(localFile)
  }
  // 获取当前时间戳
  var key = new Date().getTime()
  // 上传调用方法
  const uploadFnName = gzipImage ? 'putStream' : 'putFile'
  // 上传内容
  const uploadItem = gzipImage ? bufferToStream(gzipImage) : path.normalize(localFile)
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
      console.log('respBody', respBody)

      if (respInfo.statusCode === 200) {
        const url = upConfig.domain + '/' + respBody.key
        cb(url)
      } else {
        vscode.window.showInformationMessage(`上传失败: ${respInfo.statusCode}`)
      }
    }
  )
}

const imageGzip = async (localFile: string): Promise<any> => {
  const bufferFile = await getBufferFromFile(localFile)
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
    vscode.window.showInformationMessage('图片压缩失败')
    res = null
  }
  return res
}

/**
 * 处理图片（将原图或压缩后图片上传至七牛）
 * @param localFile
 * @param upConfig
 */
export const handleImageToQiniu = async (
  localFile: string,
  upConfig: QiNiuUpConfig
): Promise<string> => {
  let imageUrl = ''
  try {
    const reqUrl = upConfig.gzip ? 'image/compress' : 'image/upload'
    const form = new FormData()
    form.append('file', fs.createReadStream(localFile))
    form.append('qiniuConf', JSON.stringify(upConfig))
    const formHeaders = form.getHeaders()
    const {
      data: { data, status },
    } = await axios.post(`http://serve.lyaayl.com:3000/${reqUrl}`, form, {
      headers: {
        ...formHeaders,
      },
    })
    if (status.RetCode === 0) {
      // 图片上传到七牛
      imageUrl = data.url
    }
  } catch (err) {
    console.log('err', err)
  }
  return imageUrl
}

