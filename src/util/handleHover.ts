import * as https from 'https'
import * as http from 'http'

// 获取http链接 在字符串中的位置
const getHttpLinkPosition = (content: string): Array<any> => {
  const regx = /['"][http(s)://](\S*)['"]/g
  const arr = []
  let str = content
  let textStart = 0
  while (str) {
    let httpIndex = str.indexOf('http')
    if (httpIndex === 1) {
      // 'http || "http
      let resREGX = str.match(regx)
      if (resREGX) {
        arr.push({
          start: textStart,
          end: textStart + resREGX[0].length,
          value: resREGX[0],
          length: resREGX[0].length,
        })
        str = str.substring(resREGX[0].length)
        textStart += resREGX[0].length
      }
    } else if (httpIndex > -1) {
      str = str.substring(httpIndex - 1)
      textStart += httpIndex - 1
    } else {
      str = str.substring(str.length)
    }
  }
  return arr
}

// 将链接左右两边的引号删掉
const filterHttpLink = (link: string): string => {
  if (link) {
    link = link.substr(0, link.length - 1)
    link = link.substr(1)
  }
  return link
}

// 获取hover的 http链接
export const getHoverHttpLink = (content: string, position: number): string => {
  let link = ''
  const httpPositions = getHttpLinkPosition(content)
  if (httpPositions.length) {
    httpPositions.forEach((item) => {
      if (item.start <= position && item.end >= position) {
        link = item.value
      }
    })
  }
  // 如果有链接，去除链接两边的引号后返回
  return filterHttpLink(link)
}

// 图片添加裁剪参数
export const addImageCropParam = (
  url: string,
  width?: number,
  height?: number,
  type?: number
): string => {
  // 如果url中已经带有裁剪参数，先去掉之前的参数
  const [path] = url.split('?imageView2')
  url = path

  let cropUrl = type ? `?imageView2/${type}` : '?imageView2/2'
  if (!!width) {
    cropUrl += `/w/${width}`
  }
  if (!!height) {
    cropUrl += `/h/${height}`
  }
  if (!!width || !!height) {
    url += cropUrl
  }

  return url
}

// 将图片链接转为base64
export const translateImageUrlToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    let resUrl = ''
    // 链接是否为https
    const isHttps = url.includes('https')

    if (!url) {
      resolve(resUrl)
    } else {
      url = addImageCropParam(url, 100)
      ;(isHttps ? https : http).get(url, {}, function (res: http.IncomingMessage) {
        const contentType = res.headers['content-type']
        // 请求为图片
        if (contentType && contentType.includes('image')) {
          var chunks: Array<any> = [] //用于保存网络请求不断加载传输的缓冲数据
          var size = 0 //保存缓冲数据的总长度
          res.on('data', function (chunk: any) {
            chunks.push(chunk)
            //累加缓冲数据的长度
            size += chunk.length
          })
          res.on('end', function (err: any) {
            //Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
            var data = Buffer.concat(chunks, size)
            //将Buffer对象转换为字符串并以base64编码格式显示
            const base64Img = data.toString('base64')
            resolve(`data:image/png;base64,${base64Img}`)
          })
        } else {
          resolve(resUrl)
        }
      })
    }
  })
}
