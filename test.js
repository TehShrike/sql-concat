const test = require(`tape`)
const q = require(`./index`)

test(`first query`, t => {
	q.select(`WRONG`)

	const result = q.select(`butt`)
		.from(`pants`)
		.build()

	t.equal(result.sql, [
		`SELECT butt`,
		`FROM pants`,
	].join(`\n`))

	t.end()
})

test(`select/from/where with params`, t => {
	const result = q.select(`butt`)
		.from(`pants`)
		.where(`touching`, true)
		.where(`hugging`, true)
		.where(`feeling`, false)
		.build()

	t.equal(result.sql, [
		`SELECT butt`,
		`FROM pants`,
		`WHERE touching = ? AND hugging = ? AND feeling = ?`,
	].join(`\n`))
	t.deepEqual(result.values, [ true, true, false ])

	t.equal(result.sql, [
		`SELECT butt`,
		`FROM pants`,
		`WHERE touching = ? AND hugging = ? AND feeling = ?`,
	].join(`\n`))
	t.deepEqual(result.values, [ true, true, false ])

	t.end()
})

test(`some joins`, t => {
	const result = q.select(`wat`)
		.from(`meh`)
		.join(`no_in_fact_u`, `no_in_fact_u.meh_id = meh.id`)
		.leftJoin(`who`, `who.no_in_fact_u_id = no_in_fact_u.id`)
		.build()

	t.equal(result.sql, [
		`SELECT wat`,
		`FROM meh`,
		`JOIN no_in_fact_u ON no_in_fact_u.meh_id = meh.id`,
		`LEFT JOIN who ON who.no_in_fact_u_id = no_in_fact_u.id`,
	].join(`\n`))

	t.end()
})

test(`WHERE a OR b`, t => {
	const result = q.select(`wat`)
		.from(`whatever`)
		.where(`a`, 1)
		.orWhere(`b`, 2)
		.orWhere(`c`, [ 3, 4 ])
		.build()

	t.equal(result.sql, [
		`SELECT wat`,
		`FROM whatever`,
		`WHERE a = ? OR b = ? OR c IN(?)`,
	].join(`\n`))

	t.deepEqual(result.values, [ 1, 2, [ 3, 4 ] ])
	t.end()
})

test(`multiple select values`, t => {
	t.equal(q.select(`a`, `b`, `c`).from(`blah`).build().sql, `SELECT a, b, c\nFROM blah`)
	t.end()
})

test(`from clause with alias`, t => {
	t.equal(
		q.select(`whatever`).from(`blah`, `a_longer_name_for_no_reason`).build().sql,
		`SELECT whatever\nFROM blah AS a_longer_name_for_no_reason`,
	)
	t.end()
})

test(`subqueries`, t => {
	const subquery = q.select(`thing`).from(`place`).where(`column`, `value`)

	let result = q.select(`a`)
		.from(subquery, `subquery_alias`)
		.having(`subquery_alias.thing`, 2)
		.where(`subquery_alias.thing`, 1)
		.build()

	t.equal(result.sql, [
		`SELECT a`,
		`FROM (`,
		`\tSELECT thing`,
		`\tFROM place`,
		`\tWHERE column = ?`,
		`) AS subquery_alias`,
		`WHERE subquery_alias.thing = ?`,
		`HAVING subquery_alias.thing = ?`,
	].join(`\n`))

	t.deepEqual(result.values, [ `value`, 1, 2 ])

	result = q.select(`dumb_column`)
		.from(`dumb_table`, `dumb_alias`)
		.leftJoin(subquery, `dumb_subquery`, `dumb_subquery.column = dumb_alias.column`)
		.build()

	t.equal(result.sql, [
		`SELECT dumb_column`,
		`FROM dumb_table AS dumb_alias`,
		`LEFT JOIN (`,
		`\tSELECT thing`,
		`\tFROM place`,
		`\tWHERE column = ?`,
		`) AS dumb_subquery ON dumb_subquery.column = dumb_alias.column`,
	].join(`\n`))

	t.deepEqual(result.values, [ `value` ])

	t.end()
})

test(`group by`, t => {
	t.equal(
		q.groupBy(`a`, `b`).from(`wat`).select(`lol`).where(`butts`, 13).build().sql,
		[ `SELECT lol`, `FROM wat`, `WHERE butts = ?`, `GROUP BY a, b` ].join(`\n`),
	)
	t.end()
})

test(`where like`, t => {
	const result = q.select(`lol`).from(`butt`).whereLike(`column`, `starts with%`).build()
	t.equal(result.sql, [ `SELECT lol`, `FROM butt`, `WHERE column LIKE ?` ].join(`\n`))
	t.deepEqual(result.values, [ `starts with%` ])

	const result2 = q.select(`lol`).from(`butt`).whereLike(`column`, `starts with%`).orWhereLike(`other_column`, `%ends with`).build()
	t.equal(result2.sql, [ `SELECT lol`, `FROM butt`, `WHERE column LIKE ? OR other_column LIKE ?` ].join(`\n`))
	t.deepEqual(result2.values, [ `starts with%`, `%ends with` ])

	t.end()
})

test(`order by`, t => {
	const result = q.select(`lol`).from(`butt`).orderBy(`column1`, `column2`).build()
	t.equal(result.sql, [ `SELECT lol`, `FROM butt`, `ORDER BY column1, column2` ].join(`\n`))
	t.deepEqual(result.values, [ ])

	t.end()
})

test(`limit`, t => {
	const result = q.select(`lol`).from(`butt`).limit(10).build()
	t.equal(result.sql, [ `SELECT lol`, `FROM butt`, `LIMIT 10` ].join(`\n`))
	t.deepEqual(result.values, [ ])

	t.end()
})

test(`null in a where clause`, t => {
	const result = q.select(`whatever`).from(`meh`).where(`something`, null).where(`thingy`, `whatevs`).build()

	t.equal(result.sql, [ `SELECT whatever`, `FROM meh`, `WHERE something IS ? AND thingy = ?` ].join(`\n`))
	t.deepEqual(result.values, [ null, `whatevs` ])

	t.end()
})

test(`null in a where clause with comparator`, t => {
	const result = q.select(`whatever`).from(`meh`).where(`something`, `IS NOT`, null).where(`thingy`, `whatevs`).build()

	t.equal(result.sql, [ `SELECT whatever`, `FROM meh`, `WHERE something IS NOT ? AND thingy = ?` ].join(`\n`))
	t.deepEqual(result.values, [ null, `whatevs` ])

	t.end()
})

test(`where in(array)`, t => {
	const result = q.select(`whatever`).from(`meh`).where(`something`, [ 1, 2, 3 ]).build()

	t.equal(result.sql, [ `SELECT whatever`, `FROM meh`, `WHERE something IN(?)` ].join(`\n`))
	t.deepEqual(result.values, [ [ 1, 2, 3 ] ])

	t.end()
})

test(`lock in shared mode`, t => {
	const result = q.select(`whatever`).from(`meh`).where(`something`, 22).lockInShareMode().build()

	t.equal(result.sql, [ `SELECT whatever`, `FROM meh`, `WHERE something = ?`, `LOCK IN SHARE MODE` ].join(`\n`))
	t.deepEqual(result.values, [ 22 ])

	t.end()
})

test(`select for update`, t => {
	const result = q.select(`whatever`).from(`meh`).where(`something`, 22).forUpdate().build()

	t.equal(result.sql, [ `SELECT whatever`, `FROM meh`, `WHERE something = ?`, `FOR UPDATE` ].join(`\n`))
	t.deepEqual(result.values, [ 22 ])

	t.end()
})

test(`WHERE gt/lt/gte/lte AND`, t => {
	const result = q.select(`wat`)
		.from(`whatever`)
		.where(`a`, `>`, 1)
		.where(`b`, `>=`, 2)
		.where(`c`, `<`, 3)
		.where(`d`, `<=`, 4)
		.build()

	t.equal(result.sql, [
		`SELECT wat`,
		`FROM whatever`,
		`WHERE a > ? AND b >= ? AND c < ? AND d <= ?`,
	].join(`\n`))

	t.deepEqual(result.values, [ 1, 2, 3, 4 ])

	t.end()
})

test(`WHERE gt/lt/gte/lte OR`, t => {
	const result = q.select(`wat`)
		.from(`whatever`)
		.orWhere(`a`, `>`, 1)
		.orWhere(`b`, `>=`, 2)
		.orWhere(`c`, `<`, 3)
		.orWhere(`d`, `<=`, 4)
		.build()

	t.equal(result.sql, [
		`SELECT wat`,
		`FROM whatever`,
		`WHERE a > ? OR b >= ? OR c < ? OR d <= ?`,
	].join(`\n`))

	t.deepEqual(result.values, [ 1, 2, 3, 4 ])

	t.end()
})

test(`HAVING gt/lt/gte/lte AND`, t => {
	const result = q.select(`wat`)
		.from(`whatever`)
		.having(`a`, `>`, 1)
		.having(`b`, `>=`, 2)
		.having(`c`, `<`, 3)
		.having(`d`, `<=`, 4)
		.build()

	t.equal(result.sql, [
		`SELECT wat`,
		`FROM whatever`,
		`HAVING a > ? AND b >= ? AND c < ? AND d <= ?`,
	].join(`\n`))

	t.deepEqual(result.values, [ 1, 2, 3, 4 ])

	t.end()
})

test(`HAVING gt/lt/gte/lte OR`, t => {
	const result = q.select(`wat`)
		.from(`whatever`)
		.orHaving(`a`, `>`, 1)
		.orHaving(`b`, `>=`, 2)
		.orHaving(`c`, `<`, 3)
		.orHaving(`d`, `<=`, 4)
		.build()

	t.equal(result.sql, [
		`SELECT wat`,
		`FROM whatever`,
		`HAVING a > ? OR b >= ? OR c < ? OR d <= ?`,
	].join(`\n`))

	t.deepEqual(result.values, [ 1, 2, 3, 4 ])

	t.end()
})

test(`Tagged template string`, t => {
	const result = q`SELECT wat FROM a WHERE foo = ${ 4 } AND bar IN(${ [ 1, 2 ] })`

	t.equal(result.sql, `SELECT wat FROM a WHERE foo = ? AND bar IN(?)`)
	t.deepEqual(result.values, [ 4, [ 1, 2 ] ])

	t.end()
})

test(`Query object in a tagged template string`, t => {
	const subquery = q.select(`sub`).from(`other`).where(`three`, 3).build()
	const result = q`SELECT wat FROM a WHERE foo = ${ subquery } AND bar IN(${ [ 1, 2 ] })`

	t.equal(result.sql, `SELECT wat FROM a WHERE foo = (SELECT sub\nFROM other\nWHERE three = ?) AND bar IN(?)`)
	t.deepEqual(result.values, [ 3, [ 1, 2 ] ])

	t.end()
})

test(`Passing a str/params object as a value`, t => {
	const { sql, values } = q.select(`howdy`)
		.from(`meh`)
		.where(`a`, 1)
		.where(`tag`, {
			sql: `FANCY(?, ?)`,
			values: [ `pants`, `butts` ],
		})
		.where(`b`, 2)
		.build()

	t.equal(sql, `SELECT howdy\nFROM meh\nWHERE a = ? AND tag = FANCY(?, ?) AND b = ?`)
	t.deepEqual(values, [ 1, `pants`, `butts`, 2 ])

	t.end()
})

test(`Passing a str/params object in an "on" clause`, t => {
	const { sql, values } = q.select(`howdy`)
		.from(`meh`)
		.where(`a`, 1)
		.join(`tag`, {
			sql: `something_cool = FANCY(?, ?)`,
			values: [ `pants`, `butts` ],
		})
		.where(`b`, 2)
		.build()

	t.equal(sql, `SELECT howdy\nFROM meh\nJOIN tag ON something_cool = FANCY(?, ?)\nWHERE a = ? AND b = ?`)
	t.deepEqual(values, [ `pants`, `butts`, 1, 2 ])

	t.end()
})

test(`Integration: passing a tagged template string result as an argument`, t => {
	const { sql, values } = q.where(`tag`, q`FANCY(${ `pants` }, ${ `butts` })`).build()

	t.equal(sql, `WHERE tag = FANCY(?, ?)`)
	t.deepEqual(values, [ `pants`, `butts` ])

	t.end()
})

test(`Passing str/params into every clause`, t => {
	const assertLegit = (query, expectedStr) => {
		const { sql, values } = query.build()

		t.equal(sql, expectedStr, expectedStr)
		t.deepEqual(values, [ 1, 2 ])
	}

	assertLegit(
		q.select(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		`SELECT FOO(?), BAR(?)`,
	)
	assertLegit(
		q.join(`table`, q`FOO(${ 1 }) = BAR(${ 2 })`),
		`JOIN table ON FOO(?) = BAR(?)`,
	)
	assertLegit(
		q.leftJoin(`table`, q`FOO(${ 1 }) = BAR(${ 2 })`),
		`LEFT JOIN table ON FOO(?) = BAR(?)`,
	)
	assertLegit(
		q.where(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		`WHERE FOO(?) = BAR(?)`,
	)
	assertLegit(
		q.whereLike(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		`WHERE FOO(?) LIKE BAR(?)`,
	)
	assertLegit(
		q.having(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		`HAVING FOO(?) = BAR(?)`,
	)
	assertLegit(
		q.groupBy(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		`GROUP BY FOO(?), BAR(?)`,
	)
	assertLegit(
		q.orderBy(q`FOO(${ 1 })`, q`BAR(${ 2 })`),
		`ORDER BY FOO(?), BAR(?)`,
	)

	t.end()
})

test(`sql/values are legit with mulitple clauses`, t => {
	const result = q.select(`table1.some_boring_id, table2.something_interesting, mystery_table.surprise`, q`LEAST(table1.whatever, ?) AS whatever`)
		.from(`table1`)
		.join(`table2`, `table1.some_boring_id = table2.id`)
		.leftJoin(`mystery_table`, `mystery_table.twister_reality = table2.probably_null_column`)
		.where(`table1.pants`, `fancy`)
		.where(`table1.britches`, `>`, 99)
		.build()

	t.equal(result.sql, [
		`SELECT table1.some_boring_id, table2.something_interesting, mystery_table.surprise, LEAST(table1.whatever, ?) AS whatever`,
		`FROM table1`,
		`JOIN table2 ON table1.some_boring_id = table2.id`,
		`LEFT JOIN mystery_table ON mystery_table.twister_reality = table2.probably_null_column`,
		`WHERE table1.pants = ? AND table1.britches > ?`,
	].join(`\n`))

	t.equal(result.sql, [
		`SELECT table1.some_boring_id, table2.something_interesting, mystery_table.surprise, LEAST(table1.whatever, ?) AS whatever`,
		`FROM table1`,
		`JOIN table2 ON table1.some_boring_id = table2.id`,
		`LEFT JOIN mystery_table ON mystery_table.twister_reality = table2.probably_null_column`,
		`WHERE table1.pants = ? AND table1.britches > ?`,
	].join(`\n`))

	t.deepEqual(result.values, [ `fancy`, 99 ])
	t.deepEqual(result.values, [ `fancy`, 99 ])

	t.end()
})

test(`custom comparator`, t => {
	const input = `whatever`

	const result = q.select(`myColumn`)
		.from(`table1`)
		.where(`MATCH(myColumn)`, ` `, q`AGAINST(${ input })`)
		.build()

	t.equal(result.sql, [
		`SELECT myColumn`,
		`FROM table1`,
		`WHERE MATCH(myColumn)   AGAINST(?)`,
	].join(`\n`))

	t.deepEqual(result.values, [ `whatever` ])

	t.end()
})

test(`no where value`, t => {
	const input = `whatever`

	const result = q.select(`myColumn`)
		.from(`table1`)
		.where(q`MATCH(myColumn) AGAINST(${ input })`)
		.where(`someOtherColumn = somethingUnrelated`)
		.build()

	t.equal(result.sql, [
		`SELECT myColumn`,
		`FROM table1`,
		`WHERE MATCH(myColumn) AGAINST(?) AND someOtherColumn = somethingUnrelated`,
	].join(`\n`))

	t.deepEqual(result.values, [ `whatever` ])

	t.end()
})

test(`Throws an error if you call whereLike without a value`, t => {
	t.throws(() => {
		q.whereLike(`nuthin`)
	}, /like/i)

	t.end()
})

test(`toString`, t => {
	const result = q.select(`myColumn`)
		.from(`table1`)
		.where(`foo`, `!=`, `baz`)
		.toString()

	t.equal(result, `SELECT myColumn\nFROM table1\nWHERE foo != 'baz'`)

	t.end()
})

test(`toString custom separator`, t => {
	const result = q.select(`myColumn`)
		.from(`table1`)
		.where(`foo`, `!=`, `baz`)
		.toString(` `)

	t.equal(result, `SELECT myColumn FROM table1 WHERE foo != 'baz'`)

	t.end()
})

test(`union + unionAll`, t => {
	const query = q.select(`myColumn`)
		.from(`table1`)
		.where(`foo`, `!=`, `baz`)
		.union(q.select(`wat`).from(`bar`).where(`biz`, true))
		.unionAll(q.select(`huh`).from(`baz`).having(`wat`, `whatever`))

	const buildResult = query.build()

	t.equal(buildResult.sql, `SELECT myColumn
FROM table1
WHERE foo != ?
UNION
SELECT wat
FROM bar
WHERE biz = ?
UNION ALL
SELECT huh
FROM baz
HAVING wat = ?`)

	t.deepEqual(buildResult.values, [ `baz`, true, `whatever` ])

	t.equal(query.toString(), `SELECT myColumn
FROM table1
WHERE foo != 'baz'
UNION
SELECT wat
FROM bar
WHERE biz = true
UNION ALL
SELECT huh
FROM baz
HAVING wat = 'whatever'`)

	t.equal(query.toString(`\n\n`), `SELECT myColumn

FROM table1

WHERE foo != 'baz'

UNION

SELECT wat

FROM bar

WHERE biz = true

UNION ALL

SELECT huh

FROM baz

HAVING wat = 'whatever'`)

	t.end()
})

test(`union query as subquery`, t => {
	const subquery = q.select(`1 AS wat`)
		.from(`table1`)
		.where(`foo`, false)
		.unionAll(q.select(`2`).from(`bar`).where(`biz`, true))

	const buildResult = q.select(`wat`).from(subquery, `meh`).build()

	t.equal(buildResult.sql, `SELECT wat
FROM (
	SELECT 1 AS wat
	FROM table1
	WHERE foo = ?
	UNION ALL
	SELECT 2
	FROM bar
	WHERE biz = ?
) AS meh`)

	t.deepEqual(buildResult.values, [ false, true ])

	t.end()
})
