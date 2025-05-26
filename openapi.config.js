import { generateService } from '@umijs/openapi'

generateService({
  requestLibPath: "import request from '@/request'", // 自定义的请求
  schemaPath: 'http://localhost:8082/api/v2/api-docs', // 后端swagger文档地址
  serversPath: './src', // 生成的文件夹的路径
})
