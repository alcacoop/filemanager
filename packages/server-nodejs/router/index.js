'use strict'

const helmet = require('helmet')
const zip = require('express-easy-zip') // 'node-archiver', 'zipstream' or 'easyzip'  may be used instead.
const bodyParser = require('body-parser')
const express = require('express')
const path = require('path')
const { setupFilemanager, id2path, handleError } = require('./lib')

module.exports = config => {
  let { encodeFn, decodeFn } = config
  setupFilemanager({ encodeFn, decodeFn })

  const router = express.Router()

  router.use(function(req, res, next) {
    res.header('Access-Control-Allow-Methods', 'GET,POST,HEAD,OPTIONS,PUT,PATCH,DELETE')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
  router.use(helmet.noCache())
  router.use(zip())
  router.use(bodyParser.json())

  let reqPath

  const connect = (moduleLocation, getArgs) => (req, res, next) => {
    require(moduleLocation)(
      Object.assign(
        {
          config,
          req,
          res,
          next,
          handleError: handleError({ config, req, res }),
        },
        getArgs ? getArgs() : {}
      )
    )
  }

  router.param('id', function(req, res, next, id) {
    try {
      reqPath = id2path(id)
    } catch (err) {
      return handleError({ config, req, res })(Object.assign(err, { httpCode: 400 }))
    }

    return next()
  })

  router.route('/files/:id/children').get(
    connect(
      './listChildren',
      _ => ({ path: reqPath })
    )
  )

  router.route('/files/:id/search').get(
    connect(
      './search',
      _ => ({ path: reqPath })
    )
  )

  router
    .route('/files/:id')
    .get(
      connect(
        './statResource',
        _ => ({ path: reqPath })
      )
    )
    .patch(
      connect(
        './renameCopyMove',
        _ => ({ path: reqPath })
      )
    )
    .delete(
      connect(
        './remove',
        _ => ({ path: reqPath })
      )
    )

  router
    .route('/files')
    .get(
      connect(
        './statResource',
        _ => ({ path: path.sep })
      )
    )
    .post(connect('./uploadOrCreate'))

  router.route('/download').get(connect('./download'))

  router.use((err, req, res, next) => handleError({ config, req, res })(err))
  return router
}
