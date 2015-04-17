var q = require('./query-object')

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
	groupBy: [],
	having: [],
	orderBy: [],
	limit: [],
	delete: []
}


module.exports = q(startingClauses)
