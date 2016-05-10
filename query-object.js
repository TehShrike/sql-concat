var clauseHandlers = require('./clause-handlers')
var constants = require('./constants')

function q(clauses) {
	return {
		select: addToClause(clauses, 'select', clauseHandlers.whateverTheyPutIn.bind(null, ', ', ', ')),
		from: addToClause(clauses, 'from', clauseHandlers.tableNameOrSubquery.bind(null)),
		join: addToClause(clauses, 'join', clauseHandlers.joinClauseHandler.bind(null, '')),
		leftJoin: addToClause(clauses, 'join', clauseHandlers.joinClauseHandler.bind(null, 'LEFT ')),
		where: addToClause(clauses, 'where', clauseHandlers.columnParam.bind(null, ' AND ', { like: false })),
		whereLike: addToClause(clauses, 'where', clauseHandlers.columnParam.bind(null, ' AND ', { like: true })),
		orWhere: addToClause(clauses, 'where', clauseHandlers.columnParam.bind(null, ' OR ', { like: false })),
		orWhereLike: addToClause(clauses, 'where', clauseHandlers.columnParam.bind(null, ' OR ', { like: true })),
		having: addToClause(clauses, 'having', clauseHandlers.columnParam.bind(null, ' AND ', { like: false })),
		orHaving: addToClause(clauses, 'having', clauseHandlers.columnParam.bind(null, ' OR ', { like: false })),
		groupBy: addToClause(clauses, 'groupBy', clauseHandlers.whateverTheyPutIn.bind(null, ', ', ', ')),
		orderBy: addToClause(clauses, 'orderBy', clauseHandlers.whateverTheyPutIn.bind(null, ', ', ', ')),
		limit: addToClause(clauses, 'limit', clauseHandlers.whateverTheyPutIn.bind(null, ', ', ', ')),
		forUpdate: addToClause(clauses, 'lock', clauseHandlers.staticText.bind(null, 'FOR UPDATE')),
		lockInShareMode: addToClause(clauses, 'lock', clauseHandlers.staticText.bind(null, 'LOCK IN SHARE MODE')),
		build: build.bind(null, clauses),
		getClauses: copy.bind(null, clauses)
	}
}

function build(clauses, joinedBy) {
	joinedBy = typeof joinedBy === 'string' ? joinedBy : '\n'
	return constants.clauseOrder.map(function(key) {
		return {
			key: key,
			ary: clauses[key]
		}
	}).filter(function(clause) {
		return clause.ary && clause.ary.length > 0
	}).map(function(clause) {
		return reduceClauseArray(clause.ary, constants.clauseKeyToString[clause.key])
	}).reduce(function(part1, part2) {
		return combine(joinedBy, part1, part2)
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
