var constants = require('./constants')

module.exports = {
	staticText: function staticText(text) {
		return {
			str: text
		}
	},
	whateverTheyPutIn: function whateverTheyPutIn() {
		var args = Array.prototype.slice.apply(arguments)
		var clausePartsJoinedBy = args.shift()
		var partsJoinedBy = args.shift()

		return {
			str: args.join(partsJoinedBy),
			joinedBy: clausePartsJoinedBy
		}
	},
	tableNameOrSubquery: function(table, alias) {
		if (isAQuery(table)) {
			var result = table.build('\n\t')

			return {
				str: combineWithAlias('(\n\t' + result.str + '\n)', alias),
				params: result.params
			}
		} else {
			return {
				str: combineWithAlias(table, alias)
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
			joinedBy: joinedBy
		}
	},
	joinClauseHandler: function joinClauseHandler(type, table, alias, on) {
		if (!on) {
			on = alias
			alias = undefined
		}

		function joinString() {
			return type + 'JOIN '
		}

		function onString() {
			return on ? ' ON ' + on : ''
		}

		if (isAQuery(table)) {
			var result = table.build('\n\t')

			return {
				str: joinString() + combineWithAlias('(\n\t' + result.str + '\n)', alias) + onString(),
				params: result.params,
				joinedBy: '\n'
			}
		} else {
			return {
				str: joinString() + combineWithAlias(table, alias) + onString(),
				joinedBy: '\n'
			}
		}
	}
}

function getComparisonAndParameterString(param, like, comparison) {
	if (param === null) {
		return ' ' + (comparison || 'IS') + ' ?'
	} else if (Array.isArray(param)) {
		return ' ' + (comparison || 'IN') + '(?)'
	} else {
		var equalityCheck = like ? 'LIKE' : (comparison || '=')
		return ' ' + equalityCheck + ' ?'
	}
}

function isAQuery(q) {
	var clauses = q && typeof q.getClauses === 'function' && q.getClauses()

	return clauses && constants.clauseOrder.every(function(clauseName) {
		return clauses[clauseName]
	})
}

function combineWithAlias(str, alias) {
	return alias ? (str + ' AS ' + alias) : str
}
