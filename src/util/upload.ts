const fs = require('fs')
const FormData = require('form-data')
const axios = require('axios')
import * as vscode from 'vscode'

// 七牛上传配置
export interface QiNiuUpConfig {
  domain: string // 上传后域名
  accessKey: string // 七牛参数
  secretKey: string // 七牛参数
  scope: string // 七牛上传空间
  gzip: boolean // 是否需要压缩
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
    const qiniuConfKeys: Array<keyof QiNiuUpConfig> = ['accessKey', 'secretKey', 'domain', 'scope']
    // 七牛参数是否全都有，如果有一个没有则不传， 默认都有
    let isQiniuConfAll = true
    // 设置传入接口的参数 qiniuConf
    const qiniuConf: any = {}
    qiniuConfKeys.forEach(key => {
      if (upConfig[key]) {
        qiniuConf[key] = upConfig[key]
      } else {
        // 有一个没有则为false
        isQiniuConfAll = false
      }
    })
    // 设置请求接口，如果不压缩则直接上传原图
    const reqUrl = upConfig.gzip ? 'image/compress' : 'image/upload'
    const form = new FormData()
    form.append('file', fs.createReadStream(localFile))
    if (isQiniuConfAll) {
      form.append('qiniuConf', JSON.stringify(qiniuConf))
    } else {
      vscode.window.showWarningMessage('您还没有设置插件所需的七牛配置参数,将使用默认参数')
    }
    const formHeaders = form.getHeaders()
    const {
      data: { data, status }
    } = await axios.post(`http://serve.lyaayl.com:3000/${reqUrl}`, form, {
      headers: {
        ...formHeaders,
      },
    })
    if (status.code === 0) {
      // 图片上传到七牛
      imageUrl = data.url
    } else {
      vscode.window.showErrorMessage(status.msg)
    }
  } catch (err) {
    const message = err.message ? err.message : err
    vscode.window.showErrorMessage(message)
  }
  return imageUrl
}

