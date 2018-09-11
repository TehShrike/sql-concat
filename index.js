const q = require(`./query-object`)
const { startingClauses } = require(`./constants`)
const taggedTemplate = require(`./tagged-template.js`)

module.exports = Object.assign(taggedTemplate, q(startingClauses))
