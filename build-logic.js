const constants = require(`./constants`)

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

module.exports = {
	build,
}
