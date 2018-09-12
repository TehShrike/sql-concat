const { clauseOrder } = require(`./constants`)

module.exports = {
	staticText(text) {
		return {
			str: text,
		}
	},
	whateverTheyPutIn(clausePartsJoinedBy, partsJoinedBy, ...args) {
		const { str, params } = joinValues(args, partsJoinedBy)
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
	columnParam(joinedBy, opts, column, comparator, value) {
		opts = opts || {}

		if (value === undefined) {
			value = comparator
			comparator = undefined
		}

		const valueIsObject = (value && typeof value === `object` && value.params)

		const params = valueIsObject
			? value.params
			: [ value ]

		const comparatorAndValue = valueIsObject
			? getComparison(opts.like, comparator) + ` ` + value.str
			: getComparisonAndParameterString(value, opts.like, comparator)

		return {
			str: `${column} ${comparatorAndValue}`,
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

const joinValues = (values, joinedBy) => {
	const params = []
	const strs = []

	values.forEach(value => {
		if (value && typeof value === `object` && value.params) {
			params.push(...value.params)
			strs.push(value.str)
		} else {
			strs.push(value)
		}
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
