const { clauseOrder } = require(`./constants`)

module.exports = {
	staticText(text) {
		return {
			sql: text,
		}
	},
	whateverTheyPutIn(clausePartsJoinedBy, partsJoinedBy, ...expressions) {
		const { sql, values } = joinExpressions(expressions, partsJoinedBy)
		return {
			sql,
			values,
			joinedBy: clausePartsJoinedBy,
		}
	},
	tableNameOrSubquery(table, alias) {
		if (hasABuildFunction(table)) {
			const result = table.build(`\n\t`)

			return {
				sql: combineWithAlias(`(\n\t${ result.sql }\n)`, alias),
				values: result.values,
			}
		} else {
			return {
				sql: combineWithAlias(table, alias),
			}
		}
	},
	columnParam(joinedBy, opts, expression, comparator, value) {
		opts = opts || {}

		const expressionObject = expressionToObject(expression)

		if (comparator === undefined) {
			if (opts.like) {
				throw new Error(`You can't use a "like" comparison without passing in a value`)
			}
			return { joinedBy, ...expressionObject }
		} else if (value === undefined) {
			value = comparator
			comparator = undefined
		}

		const valueIsObject = (value && typeof value === `object` && value.values && typeof value.values === `object`)

		const valueParams = valueIsObject
			? value.values
			: [ value ]

		const values = [ ...expressionObject.values, ...valueParams ]

		const comparatorAndValue = valueIsObject
			? getComparison(opts.like, comparator) + ` ` + value.sql
			: getComparisonAndParameterString(value, opts.like, comparator)

		return {
			sql: `${ expressionObject.sql } ${ comparatorAndValue }`,
			values,
			joinedBy,
		}
	},
	joinClauseHandler(type, table, alias, on) {
		if (!on) {
			on = alias
			alias = undefined
		}

		function joinString() {
			return `${ type }JOIN `
		}

		let onParams = []
		let onString = ``

		if (on) {
			if (on.values) {
				onParams = on.values
				onString = makeOn(on.sql)
			} else {
				onString = makeOn(on)
			}
		}


		if (hasABuildFunction(table)) {
			const result = table.build(`\n\t`)

			return {
				sql: joinString() + combineWithAlias(`(\n\t${ result.sql }\n)`, alias) + onString,
				values: [ ...result.values, ...onParams ],
				joinedBy: `\n`,
			}
		} else {
			return {
				sql: joinString() + combineWithAlias(table, alias) + onString,
				values: onParams,
				joinedBy: `\n`,
			}
		}
	},
}

const makeOn = on => on ? ` ON ${ on }` : ``

const expressionToObject = expression => {
	if (expression && typeof expression === `object` && expression.values) {
		return expression
	} else {
		return {
			sql: expression,
			values: [],
		}
	}
}

const joinExpressions = (expressions, joinedBy) => {
	const values = []
	const sqls = []

	expressions.forEach(expression => {
		const object = expressionToObject(expression)
		values.push(...object.values)
		sqls.push(object.sql)
	})

	return {
		sql: sqls.join(joinedBy),
		values,
	}
}

const getComparison = (like, comparison) => like ? `LIKE` : (comparison || `=`)
function getComparisonAndParameterString(value, like, comparison) {
	if (value === null) {
		return `${ (comparison || `IS`) } ?`
	} else if (Array.isArray(value)) {
		return `${ (comparison || `IN`) }(?)`
	} else {
		return `${ getComparison(like, comparison) } ?`
	}
}

function hasABuildFunction(q) {
	return typeof q.build === `function`
}

function combineWithAlias(str, alias) {
	return alias ? (`${ str } AS ${ alias }`) : str
}
