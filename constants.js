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
	whereIn: 'WHERE',
	groupBy: 'GROUP BY',
	having: 'HAVING',
	orderBy: 'ORDER BY',
	limit: 'LIMIT',
	delete: 'DELETE',
	lock: ''
}

var clauseOrder = ['select', 'insert', 'delete', 'values',
	'update', 'set', 'from', 'join',
	'where', 'whereIn', 'onDuplicate', 'groupBy', 'having',
	'orderBy', 'limit', 'lock']

var startingClauses = {
	select: [],
	insert: [],
	onDuplicate: [],
	values: [],
	update: [],
	set: [],
	from: [],
	join: [],
	where: [],
	whereIn: [],
	groupBy: [],
	having: [],
	orderBy: [],
	limit: [],
	delete: [],
	lock: []
}

module.exports = {
	clauseOrder: clauseOrder,
	clauseKeyToString: clauseKeyToString,
	startingClauses: startingClauses
}
