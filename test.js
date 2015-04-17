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
		.join('who', 'who.no_in_fact_u_id = no_in_fact_u.id', 'LEFT')
		.build()

	t.equal(result.str, ['SELECT wat',
			'FROM meh',
			'JOIN no_in_fact_u ON no_in_fact_u.meh_id = meh.id',
			'LEFT JOIN who ON who.no_in_fact_u_id = no_in_fact_u.id'].join('\n'))

	t.end()
})
