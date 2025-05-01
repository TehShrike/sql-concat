import q from './query-object.js'
import { startingClauses } from './constants.js'
import taggedTemplate from './tagged-template.js'

export default Object.assign(taggedTemplate, q(startingClauses))
