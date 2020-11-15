const qiniu = require('qiniu')

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

export const upImageToQiniu = (
  loaclFile: string,
  cb: { (res: any): void; (arg0: any): void },
  upConfig: QiNiuUpConfig
) => {
  const config = new qiniu.conf.Config()
  // config.zone = qiniu.zone.Zone_z2
  const formUploader = new qiniu.form_up.FormUploader(config)
  const putExtra = new qiniu.form_up.PutExtra()
  const token = getToken(upConfig.accessKey, upConfig.secretKey, upConfig.scope)
  // 获取当前时间戳
  var key = new Date().getTime()
  formUploader.putFile(token, key, loaclFile, putExtra, function (
    respErr: any,
    respBody: any,
    respInfo: any
  ) {
    const url = upConfig.domain + '/' + respInfo.data.key
    cb(url)
  })
}
