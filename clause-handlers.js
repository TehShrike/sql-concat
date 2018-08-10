const { clauseOrder } = require(`./constants`)

module.exports = {
	staticText: function staticText(text) {
		return {
			str: text,
		}
	},
	whateverTheyPutIn: function whateverTheyPutIn() {
		const args = Array.prototype.slice.apply(arguments)
		const clausePartsJoinedBy = args.shift()
		const partsJoinedBy = args.shift()

		return {
			str: args.join(partsJoinedBy),
			joinedBy: clausePartsJoinedBy,
		}
	},
	tableNameOrSubquery(table, alias) {
		if (isAQuery(table)) {
			const result = table.build(`\n\t`)

			return {
				str: combineWithAlias(`(\n\t` + result.str + `\n)`, alias),
				params: result.params,
			}
		} else {
			return {
				str: combineWithAlias(table, alias),
			}
		}
	},
	columnParam: function columnParam(joinedBy, opts, column, comparison, param) {
		opts = opts || {}

		if (param === undefined) {
			param = comparison
			comparison = undefined
		}

		return {
			params: [ param ],
			str: column + getComparisonAndParameterString(param, opts.like, comparison),
			joinedBy,
		}
	},
	joinClauseHandler: function joinClauseHandler(type, table, alias, on) {
		if (!on) {
			on = alias
			alias = undefined
		}

		function joinString() {
			return type + `JOIN `
		}

		function onString() {
			return on ? ` ON ` + on : ``
		}

		if (isAQuery(table)) {
			const result = table.build(`\n\t`)

			return {
				str: joinString() + combineWithAlias(`(\n\t` + result.str + `\n)`, alias) + onString(),
				params: result.params,
				joinedBy: `\n`,
			}
		} else {
			return {
				str: joinString() + combineWithAlias(table, alias) + onString(),
				joinedBy: `\n`,
			}
		}
	},
}

function getComparisonAndParameterString(param, like, comparison) {
	if (param === null) {
		return ` ` + (comparison || `IS`) + ` ?`
	} else if (Array.isArray(param)) {
		return ` ` + (comparison || `IN`) + `(?)`
	} else {
		const equalityCheck = like ? `LIKE` : (comparison || `=`)
		return ` ` + equalityCheck + ` ?`
	}
}

function isAQuery(q) {
	const clauses = q && typeof q.getClauses === `function` && q.getClauses()

	return clauses && clauseOrder.every(clauseName => clauses[clauseName])
}

function combineWithAlias(str, alias) {
	return alias ? (str + ` AS ` + alias) : str
}
