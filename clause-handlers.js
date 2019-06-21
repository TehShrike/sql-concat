const { clauseOrder } = require(`./constants`)

module.exports = {
	staticText(text) {
		return {
			str: text,
		}
	},
	whateverTheyPutIn(clausePartsJoinedBy, partsJoinedBy, ...expressions) {
		const { str, params } = joinExpressions(expressions, partsJoinedBy)
		return {
			str,
			params,
			joinedBy: clausePartsJoinedBy,
		}
	},
	tableNameOrSubquery(table, alias) {
		if (isAQuery(table)) {
			const result = table.build(`\n\t`)

			return {
				str: combineWithAlias(`(\n\t${ result.str }\n)`, alias),
				params: result.params,
			}
		} else {
			return {
				str: combineWithAlias(table, alias),
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
			return Object.assign({ joinedBy }, expressionObject)
		} else if (value === undefined) {
			value = comparator
			comparator = undefined
		}

		const valueIsObject = (value && typeof value === `object` && value.params)

		const valueParams = valueIsObject
			? value.params
			: [ value ]

		const params = [ ...expressionObject.params, ...valueParams ]

		const comparatorAndValue = valueIsObject
			? getComparison(opts.like, comparator) + ` ` + value.str
			: getComparisonAndParameterString(value, opts.like, comparator)

		return {
			str: `${ expressionObject.str } ${ comparatorAndValue }`,
			params,
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
			if (on.params) {
				onParams = on.params
				onString = makeOn(on.str)
			} else {
				onString = makeOn(on)
			}
		}


		if (isAQuery(table)) {
			const result = table.build(`\n\t`)

			return {
				str: joinString() + combineWithAlias(`(\n\t${ result.str }\n)`, alias) + onString,
				params: [ ...result.params, ...onParams ],
				joinedBy: `\n`,
			}
		} else {
			return {
				str: joinString() + combineWithAlias(table, alias) + onString,
				params: onParams,
				joinedBy: `\n`,
			}
		}
	},
}

const makeOn = on => on ? ` ON ${ on }` : ``

const expressionToObject = expression => {
	if (expression && typeof expression === `object` && expression.params) {
		return expression
	} else {
		return {
			str: expression,
			params: [],
		}
	}
}

const joinExpressions = (expressions, joinedBy) => {
	const params = []
	const strs = []

	expressions.forEach(expression => {
		const object = expressionToObject(expression)
		params.push(...object.params)
		strs.push(object.str)
	})

	return {
		str: strs.join(joinedBy),
		params,
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

function isAQuery(q) {
	const clauses = q && typeof q.getClauses === `function` && q.getClauses()

	return clauses && clauseOrder.every(clauseName => clauses[clauseName])
}

function combineWithAlias(str, alias) {
	return alias ? (`${ str } AS ${ alias }`) : str
}
