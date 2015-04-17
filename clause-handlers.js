module.exports = {
	whateverTheyPutIn: function whateverTheyPutIn(str) {
		return {
			str: str
		}
	},
	andColumnParam: function andColumnParam(column, param, joinedBy) {
		joinedBy = joinedBy || 'AND'
		return {
			params: [ param ],
			str: column + getComparisonAndParameterString(true, param),
			joinedBy: ' ' + joinedBy + ' '
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
