const {
	whateverTheyPutIn,
	tableNameOrSubquery,
	joinClauseHandler,
	columnParam,
	staticText,
} = require(`./clause-handlers`)
const constants = require(`./constants`)
const sqlString = require(`sqlstring`)

const combinableType = {
	text: `text`,
	clauses: `clauses`,
}

const buildCombinable = (combinableArray, joinedBy = `\n`) => combinableArray.map(({ type, clauses, text }) => {
	if (type === combinableType.text) {
		return { sql: text, values: [] }
	} else if (type === combinableType.clauses) {
		return build(clauses, joinedBy)
	}

	throw new Error(`TehShrike messed up and somehow referenced a combinable type that isn't supported: "${type}"`)
}).reduce((combined, { sql, values }) => {
	if (combined) {
		return {
			sql: combined.sql + joinedBy + sql,
			values: [
				...combined.values,
				...values,
			],
		}
	} else {
		return {
			sql,
			values,
		}
	}
}, null)

const makeCombinableQueries = combinableArray => ({
	union: ({ getClauses }) => makeCombinableQueries([
		...combinableArray,
		{ text: `UNION`, type: combinableType.text },
		{ clauses: getClauses(), type: combinableType.clauses },
	]),
	unionAll: ({ getClauses }) => makeCombinableQueries([
		...combinableArray,
		{ text: `UNION ALL`, type: combinableType.text },
		{ clauses: getClauses(), type: combinableType.clauses },
	]),
	build: joinedBy => buildCombinable(combinableArray, joinedBy),
	toString: joinedBy => {
		const { sql, values } = buildCombinable(combinableArray, joinedBy)
		return sqlString.format(sql, values)
	},
})

const combineClauses = (clausesA, combineText, clausesB) => makeCombinableQueries([
	{ clauses: clausesA, type: combinableType.clauses },
	{ text: combineText, type: combinableType.text },
	{ clauses: clausesB, type: combinableType.clauses },
])

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

function build(clauses, joinedBy = `\n`) {
	const built = constants.clauseOrder.map(
		key => ({
			key,
			ary: clauses[key],
		}),
	)
		.filter(clause => clause.ary && clause.ary.length > 0)
		.map(clause => reduceClauseArray(clause.ary, constants.clauseKeyToString[clause.key]))
		.reduce((part1, part2) => combine(joinedBy, part1, part2))

	return {
		sql: built.sql,
		values: built.values,
	}
}

function reduceClauseArray(clause, clauseQueryString) {
	const reducedClause = clause.reduce((combinedClause, clausePart) => {
		if (clausePart.values) {
			combinedClause.values = combinedClause.values.concat(clausePart.values)
		}

		const joinedBy = (combinedClause.sql && clausePart.joinedBy) ? clausePart.joinedBy : ` `

		combinedClause.sql = (combinedClause.sql + joinedBy + clausePart.sql).trim()

		return combinedClause
	}, {
		values: [],
		sql: ``,
	})

	return {
		values: reducedClause.values,
		sql: (`${ clauseQueryString } ${ reducedClause.sql }`).trim(),
	}
}

function combine(joinCharacter, part1, part2) {
	return {
		values: part1.values.concat(part2.values),
		sql: part1.sql + joinCharacter + part2.sql,
	}
}

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

module.exports = q
