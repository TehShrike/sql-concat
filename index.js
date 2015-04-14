// var escape = require('./escape')

var startingClauses = {
	select: [],
	from: [],
	where: []
}

var clauseKeyToString = {
	select: 'SELECT',
	insert: 'INSERT INTO',
	onDuplicate: 'ON DUPLICATE KEY UPDATE',
	values: 'VALUES',
	update: 'UPDATE',
	set: 'SET',
	from: 'FROM',
	join: '',
	where: 'WHERE',
	groupBy: 'GROUP BY',
	having: 'HAVING',
	orderBy: 'ORDER BY',
	limit: 'LIMIT',
	delete: 'DELETE'
}

function q(clauses) {
	return {
		select: addToClause(clauses, 'select', whateverTheyPutIn),
		from: addToClause(clauses, 'from', whateverTheyPutIn),
		where: addToClause(clauses, 'where', andColumnParam),
		build: build.bind(null, clauses)
	}
}

function build(clauses) {
	return ['select', 'from', 'where'].map(function(key) {
		return {
			key: key,
			ary: clauses[key]
		}
	}).filter(function(clause) {
		return clause.ary.length > 0
	}).map(function(clause) {
		return reduceClauseArray(clause.ary, clauseKeyToString[clause.key])
	}).reduce(function(part1, part2) {
		return joinClauseParts('\n', part1, part2)
	})
}

function reduceClauseArray(clause, clauseQueryString) {
	var reducedClause = clause.reduce(function(splitClause, clausePart) {
		splitClause.params = splitClause.params.concat(clausePart.params)
		var joinedBy = (splitClause.str && clausePart.joinedBy) ? (' ' + clausePart.joinedBy + ' ') : ' '

		splitClause.str = (splitClause.str + joinedBy + clausePart.str).trim()

		return splitClause
	}, {
		params: [],
		str: ''
	})

	return {
		params: reducedClause.params,
		str: (clauseQueryString + ' ' + reducedClause.str).trim()
	}
}

function joinClauseParts(joinCharacter, part1, part2) {
	return {
		params: part1.params.concat(part2.params),
		str: part1.str + joinCharacter + part2.str
	}
}

function addToClause(clauses, key, stringBuilder) {
	return function() {
		var newClauses = copy(clauses)
		newClauses[key].push(stringBuilder.apply(null, arguments))
		return q(newClauses)
	}
}

function whateverTheyPutIn(str) {
	return {
		params: [],
		str: str
	}
}

function andColumnParam(column, param, joinedBy) {
	joinedBy = joinedBy || 'AND'
	return {
		params: [ param ],
		str: column + ' = ' + getParameterString(param),
		joinedBy: joinedBy
	}
}

function getParameterString(param) {
	return '?'
}

function copy(o) {
	return Object.keys(o).reduce(function(newObject, key) {
		newObject[key] = o[key].slice()
		return newObject
	}, {})
}

module.exports = q(startingClauses)
