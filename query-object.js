const {
	whateverTheyPutIn,
	tableNameOrSubquery,
	joinClauseHandler,
	columnParam,
	staticText,
} = require(`./clause-handlers`)
const constants = require(`./constants`)

const q = clauses => ({
	select: addToClause(clauses, `select`, (...args) => whateverTheyPutIn(`, `, `, `, ...args)),
	from: addToClause(clauses, `from`, tableNameOrSubquery.bind(null)),
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
	forUpdate: addToClause(clauses, `lock`, (...args) => staticText(`FOR UPDATE`, ...args)),
	lockInShareMode: addToClause(clauses, `lock`, (...args) => staticText(`LOCK IN SHARE MODE`, ...args)),
	build: build.bind(null, clauses),
	getClauses: copy.bind(null, clauses),
})

function build(clauses, joinedBy) {
	joinedBy = typeof joinedBy === `string` ? joinedBy : `\n`
	return constants.clauseOrder.map(
		key => ({
			key,
			ary: clauses[key],
		})
	)
		.filter(clause => clause.ary && clause.ary.length > 0)
		.map(clause => reduceClauseArray(clause.ary, constants.clauseKeyToString[clause.key]))
		.reduce((part1, part2) => combine(joinedBy, part1, part2))
}

function reduceClauseArray(clause, clauseQueryString) {
	const reducedClause = clause.reduce((splitClause, clausePart) => {
		if (clausePart.params) {
			splitClause.params = splitClause.params.concat(clausePart.params)
		}

		const joinedBy = (splitClause.str && clausePart.joinedBy) ? clausePart.joinedBy : ` `

		splitClause.str = (splitClause.str + joinedBy + clausePart.str).trim()

		return splitClause
	}, {
		params: [],
		str: ``,
	})

	return {
		params: reducedClause.params,
		str: (clauseQueryString + ` ` + reducedClause.str).trim(),
	}
}

function combine(joinCharacter, part1, part2) {
	return {
		params: part1.params.concat(part2.params),
		str: part1.str + joinCharacter + part2.str,
	}
}

function addToClause(clauses, key, stringBuilder) {
	return function() {
		const newClauses = copy(clauses)
		newClauses[key].push(stringBuilder(...arguments))
		return q(newClauses)
	}
}


function copy(o) {
	return Object.keys(o).reduce((newObject, key) => {
		newObject[key] = o[key].slice()
		return newObject
	}, {})
}

module.exports = q
