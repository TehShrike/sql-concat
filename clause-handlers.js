const { clauseOrder } = require(`./constants`)

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
	columnParam(joinedBy, opts, value1, comparison, value2) {
		opts = opts || {}

		if (value2 === undefined) {
			value2 = comparison
			comparison = undefined
		}

		const value2Object = (value2 && typeof value2 === `object` && value2.params)
			? {
				str: ` ` + getComparison(opts.like, comparison) + ` ` + value2.str,
				params: value2.params,
			} : {
				str: getComparisonAndParameterString(value2, opts.like, comparison),
				params: [ value2 ],
			}

		const { str, params } = joinValues([ value1, value2Object ], ``)

		return {
			str,
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

const getComparison = (like, comparison) => like ? `LIKE` : (comparison || `=`)
function getComparisonAndParameterString(value, like, comparison) {
	if (value === null) {
		return ` ${ (comparison || `IS`) } ?`
	} else if (Array.isArray(value)) {
		return ` ${ (comparison || `IN`) }(?)`
	} else {
		return ` ${ getComparison(like, comparison) } ?`
	}
}

function isAQuery(q) {
	const clauses = q && typeof q.getClauses === `function` && q.getClauses()

	return clauses && clauseOrder.every(clauseName => clauses[clauseName])
}

function combineWithAlias(str, alias) {
	return alias ? (`${ str } AS ${ alias }`) : str
}
