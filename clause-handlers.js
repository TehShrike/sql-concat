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
	columnParam: function columnParam(joinedBy, opts, column, param) {
		opts = opts || {}
		return {
			params: [ param ],
			str: column + getComparisonAndParameterString(true, param, opts.like),
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

function getComparisonAndParameterString(equal, param, like) {
	var equalityCheck = like ? 'LIKE' : '='
	var negation = like ? ' NOT ' : ' !'
	if (param === null) {
		return ' IS' + (equal ? '' : 'NOT') + ' ?'
	} else if (Array.isArray(param)) {
		return (equal ? ' ' : ' NOT ') + 'IN(?)'
	} else {
		return (equal ? ' ' : negation) + equalityCheck + ' ?'
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
