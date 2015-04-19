var clauseHandlers = require('./clause-handlers')

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
		select: addToClause(clauses, 'select', clauseHandlers.whateverTheyPutIn.bind(null, ', ', ', ')),
		from: addToClause(clauses, 'from', clauseHandlers.whateverTheyPutIn.bind(null, ', ', ', ')),
		where: addToClause(clauses, 'where', clauseHandlers.columnParam.bind(null, ' AND ')),
		orWhere: addToClause(clauses, 'where', clauseHandlers.columnParam.bind(null, ' OR ')),
		join: addToClause(clauses, 'join', clauseHandlers.joinClauseHandler),
		build: build.bind(null, clauses)
	}
}

function build(clauses) {
	return ['select', 'insert', 'delete', 'values',
			'update', 'set', 'from', 'join',
			'where', 'onDuplicate', 'groupBy', 'having',
			'orderBy', 'limit'].map(function(key) {
		return {
			key: key,
			ary: clauses[key]
		}
	}).filter(function(clause) {
		return clause.ary && clause.ary.length > 0
	}).map(function(clause) {
		return reduceClauseArray(clause.ary, clauseKeyToString[clause.key])
	}).reduce(function(part1, part2) {
		return combine('\n', part1, part2)
	})
}

function reduceClauseArray(clause, clauseQueryString) {
	var reducedClause = clause.reduce(function(splitClause, clausePart) {
		if (clausePart.params) {
			splitClause.params = splitClause.params.concat(clausePart.params)
		}

		var joinedBy = (splitClause.str && clausePart.joinedBy) ? clausePart.joinedBy : ' '

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

function combine(joinCharacter, part1, part2) {
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


function copy(o) {
	return Object.keys(o).reduce(function(newObject, key) {
		newObject[key] = o[key].slice()
		return newObject
	}, {})
}

module.exports = q
