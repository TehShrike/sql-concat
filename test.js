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

test('where like', function(t) {
	var result = q.select('lol').from('butt').whereLike('column', 'starts with%').build()
	t.equal(result.str, ['SELECT lol', 'FROM butt', 'WHERE column LIKE ?'].join('\n'))
	t.deepEqual(result.params, [ 'starts with%' ])

	var result2 = q.select('lol').from('butt').whereLike('column', 'starts with%').orWhereLike('other_column', '%ends with').build()
	t.equal(result2.str, ['SELECT lol', 'FROM butt', 'WHERE column LIKE ? OR other_column LIKE ?'].join('\n'))
	t.deepEqual(result2.params, [ 'starts with%', '%ends with' ])

	t.end()
})

test('order by', function(t) {
	var result = q.select('lol').from('butt').orderBy('column1', 'column2').build()
	t.equal(result.str, ['SELECT lol', 'FROM butt', 'ORDER BY column1, column2'].join('\n'))
	t.deepEqual(result.params, [ ])

	t.end()
})

test('limit', function(t) {
	var result = q.select('lol').from('butt').limit(10).build()
	t.equal(result.str, ['SELECT lol', 'FROM butt', 'LIMIT 10'].join('\n'))
	t.deepEqual(result.params, [ ])

	t.end()
})

test('null in a where clause', function(t) {
	var result = q.select('whatever').from('meh').where('something', null).where('thingy', 'whatevs').build()

	t.equal(result.str, ['SELECT whatever', 'FROM meh', 'WHERE something IS ? AND thingy = ?'].join('\n'))
	t.deepEqual(result.params, [ null, 'whatevs' ])

	t.end()
})

test('null in a where clause with comparator', function(t) {
	var result = q.select('whatever').from('meh').where('something', 'IS NOT', null).where('thingy', 'whatevs').build()

	t.equal(result.str, [ 'SELECT whatever', 'FROM meh', 'WHERE something IS NOT ? AND thingy = ?' ].join('\n'))
	t.deepEqual(result.params, [ null, 'whatevs' ])

	t.end()
})

test('where in(array)', function(t) {
	var result = q.select('whatever').from('meh').where('something', [1, 2, 3]).build()

	t.equal(result.str, ['SELECT whatever', 'FROM meh', 'WHERE something IN(?)'].join('\n'))
	t.deepEqual(result.params, [ [1, 2, 3] ])

	t.end()
})

test('lock in shared mode', function(t) {
	var result = q.select('whatever').from('meh').where('something', 22).lockInShareMode().build()

	t.equal(result.str, ['SELECT whatever', 'FROM meh', 'WHERE something = ?', 'LOCK IN SHARE MODE'].join('\n'))
	t.deepEqual(result.params, [ 22 ])

	t.end()
})

test('select for update', function(t) {
	var result = q.select('whatever').from('meh').where('something', 22).forUpdate().build()

	t.equal(result.str, ['SELECT whatever', 'FROM meh', 'WHERE something = ?', 'FOR UPDATE'].join('\n'))
	t.deepEqual(result.params, [ 22 ])

	t.end()
})

test('WHERE gt/lt/gte/lte AND', function(t) {
	var result = q.select('wat')
		.from('whatever')
		.where('a', '>', 1)
		.where('b', '>=', 2)
		.where('c', '<', 3)
		.where('d', '<=', 4)
		.build()

	t.equal(result.str, ['SELECT wat',
		'FROM whatever',
		'WHERE a > ? AND b >= ? AND c < ? AND d <= ?'].join('\n'))

	t.deepEqual(result.params, [1, 2, 3, 4])

	t.end()
})

test('WHERE gt/lt/gte/lte OR', function(t) {
	var result = q.select('wat')
		.from('whatever')
		.orWhere('a', '>', 1)
		.orWhere('b', '>=', 2)
		.orWhere('c', '<', 3)
		.orWhere('d', '<=', 4)
		.build()

	t.equal(result.str, ['SELECT wat',
		'FROM whatever',
		'WHERE a > ? OR b >= ? OR c < ? OR d <= ?'].join('\n'))

	t.deepEqual(result.params, [1, 2, 3, 4])

	t.end()
})

test('HAVING gt/lt/gte/lte AND', function(t) {
	var result = q.select('wat')
		.from('whatever')
		.having('a', '>', 1)
		.having('b', '>=', 2)
		.having('c', '<', 3)
		.having('d', '<=', 4)
		.build()

	t.equal(result.str, ['SELECT wat',
		'FROM whatever',
		'HAVING a > ? AND b >= ? AND c < ? AND d <= ?'].join('\n'))

	t.deepEqual(result.params, [1, 2, 3, 4])

	t.end()
})

test('HAVING gt/lt/gte/lte OR', function(t) {
	var result = q.select('wat')
		.from('whatever')
		.orHaving('a', '>', 1)
		.orHaving('b', '>=', 2)
		.orHaving('c', '<', 3)
		.orHaving('d', '<=', 4)
		.build()

	t.equal(result.str, ['SELECT wat',
		'FROM whatever',
		'HAVING a > ? OR b >= ? OR c < ? OR d <= ?'].join('\n'))

	t.deepEqual(result.params, [1, 2, 3, 4])

	t.end()
})
