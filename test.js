var test = require('tape')
var q = require('./index')

test('first query', function(t) {
	q.select('WRONG')

	var result = q.select('butt')
		.from('pants')
		.build()

	console.log(result)
	t.equal(result.str, 'SELECT butt\nFROM pants')

	t.end()
})

test('select/from/where with params', function(t) {
	var result = q.select('butt')
		.from('pants')
		.where('touching', true)
		.where('hugging', true)
		.where('feeling', false)
		.build()

	t.equal(result.str, 'SELECT butt\nFROM pants\nWHERE touching = ? AND hugging = ? AND feeling = ?')
	t.deepEqual(result.params, [true, true, false])

	t.end()
})

test('some joins', function(t) {
	var result = q.select('wat')
		.from('meh')
		.join('no_in_fact_u', 'no_in_fact_u.meh_id = meh.id')
		.join('who', 'who.no_in_fact_u_id = no_in_fact_u.id', 'LEFT')

	t.equal(result.str, 'SELECT wat\nFROM meh\nJOIN no_in_fact_u ON no_in_fact_u.meh_id = meh.id\nLEFT JOIN who ON who.no_in_fact_u_id = no_in_fact_u.id')

	t.end()
})
