module.exports = {
	whateverTheyPutIn: function whateverTheyPutIn() {
		var args = Array.prototype.slice.apply(arguments)
		var clausePartsJoinedBy = args.shift()
		var partsJoinedBy = args.shift()

		return {
			str: args.join(partsJoinedBy),
			joinedBy: clausePartsJoinedBy
		}
	},
	columnParam: function columnParam(joinedBy, column, param) {
		return {
			params: [ param ],
			str: column + getComparisonAndParameterString(true, param),
			joinedBy: joinedBy
		}
	},
	joinClauseHandler: function joinClauseHandler(table, on, type) {
		return {
			str: (type ? type + ' ' : '') + 'JOIN ' + table + ' ON ' + on,
			joinedBy: '\n'
		}
	}
}

function getComparisonAndParameterString(equal, param) {
	if (param === null) {
		return ' IS ' + (equal ? '' : 'NOT') + ' ?'
	} else if (Array.isArray(param)) {
		return (equal ? ' ' : ' NOT ') + 'IN(?)'
	} else {
		return (equal ? ' ' : ' !') + '= ?'
	}
}
