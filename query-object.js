import {
	whateverTheyPutIn,
	tableNameOrSubquery,
	joinClauseHandler,
	columnParam,
	staticText,
} from './clause-handlers.js'
import sqlString from 'sqlstring'
import { combineClauses } from './combinable-logic.js'
import { build } from './build-logic.js'

const q = clauses => ({
	select: addToClause(clauses, `select`, (...args) => whateverTheyPutIn(`, `, `, `, ...args)),
	from: addToClause(clauses, `from`, tableNameOrSubquery),
	join: addToClause(clauses, `join`, (...args) => joinClauseHandler(``, ...args)),
	leftJoin: addToClause(clauses, `join`, (...args) => joinClauseHandler(`LEFT `, ...args)),
	where: addToClause(clauses, `where`, (...args) => columnParam(` AND `, { like: false }, ...args)),
	whereLike: addToClause(clauses, `where`, (...args) => columnParam(` AND `, { like: true }, ...args)),
	orWhere: addToClause(clauses, `where`, (...args) => columnParam(` OR `, { like: false }, ...args)),
	orWhereLike: addToClause(clauses, `where`, (...args) => columnParam(` OR `, { like: true }, ...args)),
	having: addToClause(clauses, `having`, (...args) => columnParam(` AND `, { like: false }, ...args)),
	orHaving: addToClause(clauses, `having`, (...args) => columnParam(` OR `, { like: false }, ...args)),
	groupBy: addToClause(clauses, `groupBy`, (...args) => whateverTheyPutIn(`, `, `, `, ...args)),
	orderBy: addToClause(clauses, `orderBy`, (...args) => whateverTheyPutIn(`, `, `, `, ...args)),
	limit: addToClause(clauses, `limit`, (...args) => whateverTheyPutIn(`, `, `, `, ...args)),
	forUpdate: addToClause(clauses, `lock`, () => staticText(`FOR UPDATE`)),
	lockInShareMode: addToClause(clauses, `lock`, () => staticText(`LOCK IN SHARE MODE`)),
	build: joinedBy => build(clauses, joinedBy),
	getClauses: () => copy(clauses),
	toString: joinedBy => {
		const { sql, values } = build(clauses, joinedBy)
		return sqlString.format(sql, values)
	},
	union: query => combineClauses(clauses, `UNION`, query.getClauses()),
	unionAll: query => combineClauses(clauses, `UNION ALL`, query.getClauses()),
})

function addToClause(clauses, key, stringBuilder) {
	return (...args) => {
		const newClauses = copy(clauses)
		newClauses[key].push(stringBuilder(...args))
		return q(newClauses)
	}
}

function copy(o) {
	return Object.keys(o).reduce((newObject, key) => {
		newObject[key] = o[key].slice()
		return newObject
	}, {})
}

export default q
