import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const specPath = path.resolve(__dirname, '../../openapi.yaml')
const openapi = YAML.parse(fs.readFileSync(specPath, 'utf8'))

const router = Router()

router.get('/openapi.json', (_req, res) => {
  res.json(openapi)
})

router.use('/', swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: 'StockFlow POS API Docs',
  swaggerOptions: {
    persistAuthorization: true,
  },
}))

export default router
