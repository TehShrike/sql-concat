var test = require('tape')
var q = require('./index')

test('first query', function(t) {
	q.select('WRONG')

	var result = q.select('butt')
		.from('pants')
		.build()

	t.equal(result.str, ['SELECT butt',
		'FROM pants'].join('\n'))

	t.end()
})

test('select/from/where with params', function(t) {
	var result = q.select('butt')
		.from('pants')
		.where('touching', true)
		.where('hugging', true)
		.where('feeling', false)
		.build()

	t.equal(result.str, ['SELECT butt',
			'FROM pants',
			'WHERE touching = ? AND hugging = ? AND feeling = ?'].join('\n'))
	t.deepEqual(result.params, [true, true, false])

	t.end()
})

test('some joins', function(t) {
	var result = q.select('wat')
		.from('meh')
		.join('no_in_fact_u', 'no_in_fact_u.meh_id = meh.id')
		.leftJoin('who', 'who.no_in_fact_u_id = no_in_fact_u.id')
		.build()

	t.equal(result.str, ['SELECT wat',
			'FROM meh',
			'JOIN no_in_fact_u ON no_in_fact_u.meh_id = meh.id',
			'LEFT JOIN who ON who.no_in_fact_u_id = no_in_fact_u.id'].join('\n'))

	t.end()
})

test('WHERE a OR b', function(t) {
	var result = q.select('wat')
		.from('whatever')
		.where('a', 1)
		.orWhere('b', 2)
		.orWhere('c', [3, 4])
		.build()

	t.equal(result.str, ['SELECT wat',
		'FROM whatever',
		'WHERE a = ? OR b = ? OR c IN(?)'].join('\n'))

	t.deepEqual(result.params, [1, 2, [3, 4]])

	t.end()
})

test('multiple select values', function(t) {
	t.equal(q.select('a', 'b', 'c').from('blah').build().str, 'SELECT a, b, c\nFROM blah')
	t.end()
})

test('from clause with alias', function(t) {
	t.equal(q.select('whatever').from('blah', 'a_longer_name_for_no_reason').build().str, 'SELECT whatever\nFROM blah AS a_longer_name_for_no_reason')
	t.end()
})

test('subqueries', function(t) {
	var subquery = q.select('thing').from('place').where('column', 'value')

	var result = q.select('a')
		.from(subquery, 'subquery_alias')
		.having('subquery_alias.thing', 2)
		.where('subquery_alias.thing', 1)
		.build()

	t.equal(result.str, ['SELECT a',
		'FROM (',
		'\tSELECT thing',
		'\tFROM place',
		'\tWHERE column = ?',
		') AS subquery_alias',
		'WHERE subquery_alias.thing = ?',
		'HAVING subquery_alias.thing = ?'].join('\n'))

	t.deepEqual(result.params, ['value', 1, 2])

	result = q.select('dumb_column')
		.from('dumb_table', 'dumb_alias')
		.leftJoin(subquery, 'dumb_subquery', 'dumb_subquery.column = dumb_alias.column')
		.build()

	t.equal(result.str, [
		'SELECT dumb_column',
		'FROM dumb_table AS dumb_alias',
		'LEFT JOIN (',
		'\tSELECT thing',
		'\tFROM place',
		'\tWHERE column = ?',
		') AS dumb_subquery ON dumb_subquery.column = dumb_alias.column'
	].join('\n'))

	t.deepEqual(result.params, ['value'])

	t.end()
})

test('group by', function(t) {
	t.equal(q.groupBy('a', 'b').from('wat').select('lol').where('butts', 13).build().str, ['SELECT lol', 'FROM wat', 'WHERE butts = ?', 'GROUP BY a, b'].join('\n'))
	t.end()
})
