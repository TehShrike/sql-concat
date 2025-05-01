import { test } from 'node:test'
import assert from 'node:assert'
import q from './index.js'

test('first query', () => {
	q.select('WRONG')

	const result = q.select('butt')
		.from('pants')
		.build()

	assert.equal(result.sql, [
		'SELECT butt',
		'FROM pants',
	].join('\n'))
})

test('select/from/where with params', () => {
	const result = q.select('butt')
		.from('pants')
		.where('touching', true)
		.where('hugging', true)
		.where('feeling', false)
		.build()

	assert.equal(result.sql, [
		'SELECT butt',
		'FROM pants',
		'WHERE touching = ? AND hugging = ? AND feeling = ?',
	].join('\n'))
	assert.deepEqual(result.values, [ true, true, false ])

	assert.equal(result.sql, [
		'SELECT butt',
		'FROM pants',
		'WHERE touching = ? AND hugging = ? AND feeling = ?',
	].join('\n'))
	assert.deepEqual(result.values, [ true, true, false ])
})

test('some joins', () => {
	const result = q.select('wat')
		.from('meh')
		.join('no_in_fact_u', 'no_in_fact_u.meh_id = meh.id')
		.leftJoin('who', 'who.no_in_fact_u_id = no_in_fact_u.id')
		.build()

	assert.equal(result.sql, [
		'SELECT wat',
		'FROM meh',
		'JOIN no_in_fact_u ON no_in_fact_u.meh_id = meh.id',
		'LEFT JOIN who ON who.no_in_fact_u_id = no_in_fact_u.id',
	].join('\n'))
})

test('WHERE a OR b', () => {
	const result = q.select('wat')
		.from('whatever')
		.where('a', 1)
		.orWhere('b', 2)
		.orWhere('c', [ 3, 4 ])
		.build()

	assert.equal(result.sql, [
		'SELECT wat',
		'FROM whatever',
		'WHERE a = ? OR b = ? OR c IN(?)',
	].join('\n'))

	assert.deepEqual(result.values, [ 1, 2, [ 3, 4 ] ])
})

test('multiple select values', () => {
	assert.equal(q.select('a', 'b', 'c').from('blah').build().sql, 'SELECT a, b, c\nFROM blah')
})

test('from clause with alias', () => {
	assert.equal(
		q.select('whatever').from('blah', 'a_longer_name_for_no_reason').build().sql,
		'SELECT whatever\nFROM blah AS a_longer_name_for_no_reason',
	)
})

test('subqueries', () => {
	const subquery = q.select('thing').from('place').where('column', 'value')

	let result = q.select('a')
		.from(subquery, 'subquery_alias')
		.having('subquery_alias.thing', 2)
		.where('subquery_alias.thing', 1)
		.build()

	assert.equal(result.sql, [
		'SELECT a',
		'FROM (',
		'\tSELECT thing',
		'\tFROM place',
		'\tWHERE column = ?',
		') AS subquery_alias',
		'WHERE subquery_alias.thing = ?',
		'HAVING subquery_alias.thing = ?',
	].join('\n'))

	assert.deepEqual(result.values, [ 'value', 1, 2 ])

	result = q.select('dumb_column')
		.from('dumb_table', 'dumb_alias')
		.leftJoin(subquery, 'dumb_subquery', 'dumb_subquery.column = dumb_alias.column')
		.build()

	assert.equal(result.sql, [
		'SELECT dumb_column',
		'FROM dumb_table AS dumb_alias',
		'LEFT JOIN (',
		'\tSELECT thing',
		'\tFROM place',
		'\tWHERE column = ?',
		') AS dumb_subquery ON dumb_subquery.column = dumb_alias.column',
	].join('\n'))

	assert.deepEqual(result.values, [ 'value' ])
})

test('group by', () => {
	assert.equal(
		q.groupBy('a', 'b').from('wat').select('lol').where('butts', 13).build().sql,
		[ 'SELECT lol', 'FROM wat', 'WHERE butts = ?', 'GROUP BY a, b' ].join('\n'),
	)
})

test('where like', () => {
	const result = q.select('lol').from('butt').whereLike('column', 'starts with%').build()
	assert.equal(result.sql, [ 'SELECT lol', 'FROM butt', 'WHERE column LIKE ?' ].join('\n'))
	assert.deepEqual(result.values, [ 'starts with%' ])

	const result2 = q.select('lol').from('butt').whereLike('column', 'starts with%').orWhereLike('other_column', '%ends with').build()
	assert.equal(result2.sql, [ 'SELECT lol', 'FROM butt', 'WHERE column LIKE ? OR other_column LIKE ?' ].join('\n'))
	assert.deepEqual(result2.values, [ 'starts with%', '%ends with' ])
})

test('order by', () => {
	const result = q.select('lol').from('butt').orderBy('column1', 'column2').build()
	assert.equal(result.sql, [ 'SELECT lol', 'FROM butt', 'ORDER BY column1, column2' ].join('\n'))
	assert.deepEqual(result.values, [ ])
})

test('limit', () => {
	const result = q.select('lol').from('butt').limit(10).build()
	assert.equal(result.sql, [ 'SELECT lol', 'FROM butt', 'LIMIT 10' ].join('\n'))
	assert.deepEqual(result.values, [ ])
})

test('limit+row count', () => {
	const result = q.select('lol').from('butt').limit(10, 15).build()
	assert.equal(result.sql, [ 'SELECT lol', 'FROM butt', 'LIMIT 10, 15' ].join('\n'))
	assert.deepEqual(result.values, [ ])
})

test('null in a where clause', () => {
	const result = q.select('whatever').from('meh').where('something', null).where('thingy', 'whatevs').build()

	assert.equal(result.sql, [ 'SELECT whatever', 'FROM meh', 'WHERE something IS ? AND thingy = ?' ].join('\n'))
	assert.deepEqual(result.values, [ null, 'whatevs' ])
})

test('null in a where clause with comparator', () => {
	const result = q.select('whatever').from('meh').where('something', 'IS NOT', null).where('thingy', 'whatevs').build()

	assert.equal(result.sql, [ 'SELECT whatever', 'FROM meh', 'WHERE something IS NOT ? AND thingy = ?' ].join('\n'))
	assert.deepEqual(result.values, [ null, 'whatevs' ])
})

test('where in(array)', () => {
	const result = q.select('whatever').from('meh').where('something', [ 1, 2, 3 ]).build()

	assert.equal(result.sql, [ 'SELECT whatever', 'FROM meh', 'WHERE something IN(?)' ].join('\n'))
	assert.deepEqual(result.values, [ [ 1, 2, 3 ] ])
})

test('lock in shared mode', () => {
	const result = q.select('whatever').from('meh').where('something', 22).lockInShareMode().build()

	assert.equal(result.sql, [ 'SELECT whatever', 'FROM meh', 'WHERE something = ?', 'LOCK IN SHARE MODE' ].join('\n'))
	assert.deepEqual(result.values, [ 22 ])
})

test('select for update', () => {
	const result = q.select('whatever').from('meh').where('something', 22).forUpdate().build()

	assert.equal(result.sql, [ 'SELECT whatever', 'FROM meh', 'WHERE something = ?', 'FOR UPDATE' ].join('\n'))
	assert.deepEqual(result.values, [ 22 ])
})

test('WHERE gt/lt/gte/lte AND', () => {
	const result = q.select('wat')
		.from('whatever')
		.where('a', '>', 1)
		.where('b', '>=', 2)
		.where('c', '<', 3)
		.where('d', '<=', 4)
		.build()

	assert.equal(result.sql, [
		'SELECT wat',
		'FROM whatever',
		'WHERE a > ? AND b >= ? AND c < ? AND d <= ?',
	].join('\n'))

	assert.deepEqual(result.values, [ 1, 2, 3, 4 ])
})

test('WHERE gt/lt/gte/lte OR', () => {
	const result = q.select('wat')
		.from('whatever')
		.orWhere('a', '>', 1)
		.orWhere('b', '>=', 2)
		.orWhere('c', '<', 3)
		.orWhere('d', '<=', 4)
		.build()

	assert.equal(result.sql, [
		'SELECT wat',
		'FROM whatever',
		'WHERE a > ? OR b >= ? OR c < ? OR d <= ?',
	].join('\n'))

	assert.deepEqual(result.values, [ 1, 2, 3, 4 ])
})

test('HAVING gt/lt/gte/lte AND', () => {
	const result = q.select('wat')
		.from('whatever')
		.having('a', '>', 1)
		.having('b', '>=', 2)
		.having('c', '<', 3)
		.having('d', '<=', 4)
		.build()

	assert.equal(result.sql, [
		'SELECT wat',
		'FROM whatever',
		'HAVING a > ? AND b >= ? AND c < ? AND d <= ?',
	].join('\n'))

	assert.deepEqual(result.values, [ 1, 2, 3, 4 ])
})

test('HAVING gt/lt/gte/lte OR', () => {
	const result = q.select('wat')
		.from('whatever')
		.orHaving('a', '>', 1)
		.orHaving('b', '>=', 2)
		.orHaving('c', '<', 3)
		.orHaving('d', '<=', 4)
		.build()

	assert.equal(result.sql, [
		'SELECT wat',
		'FROM whatever',
		'HAVING a > ? OR b >= ? OR c < ? OR d <= ?',
	].join('\n'))

	assert.deepEqual(result.values, [ 1, 2, 3, 4 ])
})

test('Tagged template string', () => {
	const result = q`SELECT wat FROM a WHERE foo = ${ 4 } AND bar IN(${ [ 1, 2 ] })`

	assert.equal(result.sql, 'SELECT wat FROM a WHERE foo = ? AND bar IN(?)')
	assert.deepEqual(result.values, [ 4, [ 1, 2 ] ])
})

test('Query object in a tagged template string', () => {
	const subquery = q.select('sub').from('other').where('three', 3).build()
	const result = q`SELECT wat FROM a WHERE foo = ${ subquery } AND bar IN(${ [ 1, 2 ] })`

	assert.equal(result.sql, 'SELECT wat FROM a WHERE foo = (SELECT sub\nFROM other\nWHERE three = ?) AND bar IN(?)')
	assert.deepEqual(result.values, [ 3, [ 1, 2 ] ])
})

test('Passing a str/params object as a value', () => {
	const { sql, values } = q.select('howdy')
		.from('meh')
		.where('a', 1)
		.where('tag', {
			sql: 'FANCY(?, ?)',
			values: [ 'pants', 'butts' ],
		})
		.where('b', 2)
		.build()

	assert.equal(sql, 'SELECT howdy\nFROM meh\nWHERE a = ? AND tag = FANCY(?, ?) AND b = ?')
	assert.deepEqual(values, [ 1, 'pants', 'butts', 2 ])
})

test('Passing a str/params object in an "on" clause', () => {
	const { sql, values } = q.select('howdy')
		.from('meh')
		.where('a', 1)
		.join('tag', {
			sql: 'something_cool = FANCY(?, ?)',
			values: [ 'pants', 'butts' ],
		})
		.where('b', 2)
		.build()

	assert.equal(sql, 'SELECT howdy\nFROM meh\nJOIN tag ON something_cool = FANCY(?, ?)\nWHERE a = ? AND b = ?')
	assert.deepEqual(values, [ 'pants', 'butts', 1, 2 ])
})

test('Integration: passing a tagged template string result as an argument', () => {
	const { sql, values } = q.where('tag', q`FANCY(${ 'pants' }, ${ 'butts' })`).build()

	assert.equal(sql, 'WHERE tag = FANCY(?, ?)')
	assert.deepEqual(values, [ 'pants', 'butts' ])
})

test('Passing str/params into every clause', () => {
	const assertLegit = (query, expectedStr) => {
		const { sql, values } = query.build()

		assert.equal(sql, expectedStr, expectedStr)
		assert.deepEqual(values, [ 1, 2 ])
	}

	assertLegit(
		q.select(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		'SELECT FOO(?), BAR(?)',
	)
	assertLegit(
		q.join('table', q`FOO(${ 1 }) = BAR(${ 2 })`),
		'JOIN table ON FOO(?) = BAR(?)',
	)
	assertLegit(
		q.leftJoin('table', q`FOO(${ 1 }) = BAR(${ 2 })`),
		'LEFT JOIN table ON FOO(?) = BAR(?)',
	)
	assertLegit(
		q.where(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		'WHERE FOO(?) = BAR(?)',
	)
	assertLegit(
		q.whereLike(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		'WHERE FOO(?) LIKE BAR(?)',
	)
	assertLegit(
		q.having(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		'HAVING FOO(?) = BAR(?)',
	)
	assertLegit(
		q.groupBy(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		'GROUP BY FOO(?), BAR(?)',
	)
	assertLegit(
		q.orderBy(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		'ORDER BY FOO(?), BAR(?)',
	)
})

test('sql/values are legit with mulitple clauses', () => {
	const result = q.select('table1.some_boring_id, table2.something_interesting, mystery_table.surprise', q`LEAST(table1.whatever, ?) AS whatever`)
		.from('table1')
		.join('table2', 'table1.some_boring_id = table2.id')
		.leftJoin('mystery_table', 'mystery_table.twister_reality = table2.probably_null_column')
		.where('table1.pants', 'fancy')
		.where('table1.britches', '>', 99)
		.build()

	assert.equal(result.sql, [
		'SELECT table1.some_boring_id, table2.something_interesting, mystery_table.surprise, LEAST(table1.whatever, ?) AS whatever',
		'FROM table1',
		'JOIN table2 ON table1.some_boring_id = table2.id',
		'LEFT JOIN mystery_table ON mystery_table.twister_reality = table2.probably_null_column',
		'WHERE table1.pants = ? AND table1.britches > ?',
	].join('\n'))

	assert.deepEqual(result.values, [ 'fancy', 99 ])
})

test('custom comparator', () => {
	const input = 'whatever'

	const result = q.select('myColumn')
		.from('table1')
		.where('MATCH(myColumn)', ' ', q`AGAINST(${ input })`)
		.build()

	assert.equal(result.sql, [
		'SELECT myColumn',
		'FROM table1',
		'WHERE MATCH(myColumn)   AGAINST(?)',
	].join('\n'))

	assert.deepEqual(result.values, [ 'whatever' ])
})

test('no where value', () => {
	const input = 'whatever'

	const result = q.select('myColumn')
		.from('table1')
		.where(q`MATCH(myColumn) AGAINST(${ input })`)
		.where('someOtherColumn = somethingUnrelated')
		.build()

	assert.equal(result.sql, [
		'SELECT myColumn',
		'FROM table1',
		'WHERE MATCH(myColumn) AGAINST(?) AND someOtherColumn = somethingUnrelated',
	].join('\n'))

	assert.deepEqual(result.values, [ 'whatever' ])
})

test('Throws an error if you call whereLike without a value', () => {
	assert.throws(() => {
		q.whereLike('nuthin')
	}, /like/i)
})

test('toString', () => {
	const result = q.select('myColumn')
		.from('table1')
		.where('foo', '!=', 'baz')
		.toString()

	assert.equal(result, 'SELECT myColumn\nFROM table1\nWHERE foo != \'baz\'')
})

test('toString custom separator', () => {
	const result = q.select('myColumn')
		.from('table1')
		.where('foo', '!=', 'baz')
		.toString(' ')

	assert.equal(result, 'SELECT myColumn FROM table1 WHERE foo != \'baz\'')
})

test('union + unionAll', () => {
	const query = q.select('myColumn')
		.from('table1')
		.where('foo', '!=', 'baz')
		.union(q.select('wat').from('bar').where('biz', true))
		.unionAll(q.select('huh').from('baz').having('wat', 'whatever'))

	const buildResult = query.build()

	assert.equal(buildResult.sql, [
		'SELECT myColumn',
		'FROM table1',
		'WHERE foo != ?',
		'UNION',
		'SELECT wat',
		'FROM bar',
		'WHERE biz = ?',
		'UNION ALL',
		'SELECT huh',
		'FROM baz',
		'HAVING wat = ?'
	].join('\n'))

	assert.deepEqual(buildResult.values, [ 'baz', true, 'whatever' ])

	assert.equal(query.toString(), [
		'SELECT myColumn',
		'FROM table1',
		'WHERE foo != \'baz\'',
		'UNION',
		'SELECT wat',
		'FROM bar',
		'WHERE biz = true',
		'UNION ALL',
		'SELECT huh',
		'FROM baz',
		'HAVING wat = \'whatever\''
	].join('\n'))

	assert.equal(query.toString('\n\n'), [
		'SELECT myColumn',
		'',
		'FROM table1',
		'',
		'WHERE foo != \'baz\'',
		'',
		'UNION',
		'',
		'SELECT wat',
		'',
		'FROM bar',
		'',
		'WHERE biz = true',
		'',
		'UNION ALL',
		'',
		'SELECT huh',
		'',
		'FROM baz',
		'',
		'HAVING wat = \'whatever\''
	].join('\n'))
})

test('union query as subquery', () => {
	const subquery = q.select('1 AS wat')
		.from('table1')
		.where('foo', false)
		.unionAll(q.select('2').from('bar').where('biz', true))

	const buildResult = q.select('wat').from(subquery, 'meh').build()

	assert.equal(buildResult.sql, [
		'SELECT wat',
		'FROM (',
		'\tSELECT 1 AS wat',
		'\tFROM table1',
		'\tWHERE foo = ?',
		'\tUNION ALL',
		'\tSELECT 2',
		'\tFROM bar',
		'\tWHERE biz = ?',
		') AS meh'
	].join('\n'))

	assert.deepEqual(buildResult.values, [ false, true ])
})
