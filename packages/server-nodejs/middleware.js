'use strict'

const router = require('./router')
const logger = require('./logger')
const { encode, decode } = require('./utils/id')

module.exports = config =>
  router({
    fsRoot: config.fsRoot,
    rootName: config.rootName,
    readOnly: config.readOnly,
    logger: config.logger || logger,
    encodeFn: config.encodeFn || encode,
    decodeFn: config.decodeFn || decode,
  })
