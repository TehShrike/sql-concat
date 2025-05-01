# sql-concat

A MySQL query builder.

```node
const q = require('sql-concat')
```

The only "breaking" change from 1.x to 2.x is that support for versions of node older than 6 was dropped.

## Designed to...

- Build queries programmatically
- Allow simple combining of query parts and their associated parameters (as opposed to writing a long query string followed by a long array of parameter values)
- Build queries for the [mysqljs/mysql](https://github.com/mysqljs/mysql) library (specifically, by expecting its [rules for query values](https://github.com/mysqljs/mysql#escaping-query-values) instead of MySQL's stored procedure parameters)

## Features

- Easily compose query parts - the query-builder object is immutable, so you can build up a base query and re-use it over and over again with small modifications (for example, with conditional where clauses or joins)
- Not as overblown as [knex](http://knexjs.org/), and allows more freedom in using string literals within query chunks
- Queries should look good when printed out (newlines between clauses, subqueries indented with tabs)

## Looks like

```node
const q = require('sql-concat')
```

<!--js
var q = require('./')
-->

```js
const minNumber = 0
const result = q.select('table1.some_boring_id, table2.something_interesting, mystery_table.surprise', q`LEAST(table1.whatever, ${minNumber}) AS whatever`)
	.from('table1')
	.join('table2', 'table1.some_boring_id = table2.id')
	.leftJoin('mystery_table', 'mystery_table.twister_reality = table2.probably_null_column')
	.where('table1.pants', 'fancy')
	.where('table1.britches', '>', 99)
	.build()

const expectedQuery = 'SELECT table1.some_boring_id, table2.something_interesting, mystery_table.surprise, LEAST(table1.whatever, ?) AS whatever\n'
		+ 'FROM table1\n'
		+ 'JOIN table2 ON table1.some_boring_id = table2.id\n'
		+ 'LEFT JOIN mystery_table ON mystery_table.twister_reality = table2.probably_null_column\n'
		+ 'WHERE table1.pants = ? AND table1.britches > ?'

result.sql // => expectedQuery

result.values // => [ 0, 'fancy', 99 ]

```

## A cooler example

Showing off the composability/reusability of the query objects, plus some dynamic query building:

```js

// A partial query that we can just leave here to reuse later:
const MOST_RECENT_SALE = q.select('item_sale.item_id, MAX(item_sale.date) AS `date`')
	.from('item_sale')
	.groupBy('item_sale.item_id')

function mostRecentSalePricesQuery(taxable, itemType) {
	const subquery = MOST_RECENT_SALE.where('taxable', taxable)

	let query = q.select('item.item_id, item.description, item.type, latest_sale.date AS latest_sale_date, latest_sale.price')
		.from('item')
		.join(subquery, 'latest_sale', 'latest_sale.item_id = item.item_id')

	// Dynamically add new clauses to the query as needed
	if (itemType) {
		query = query.where('item.item_type', itemType)
	}

	return query.build()
}

// Build those dynamic queries:

const taxableSpecialQuery = mostRecentSalePricesQuery(true, 'special')

const expectedTaxableSpecialQuery = ['SELECT item.item_id, item.description, item.type, latest_sale.date AS latest_sale_date, latest_sale.price',
	'FROM item',
	'JOIN (',
	'\tSELECT item_sale.item_id, MAX(item_sale.date) AS `date`',
	'\tFROM item_sale',
	'\tWHERE taxable = ?',
	'\tGROUP BY item_sale.item_id',
	') AS latest_sale ON latest_sale.item_id = item.item_id',
	'WHERE item.item_type = ?'].join('\n')

taxableSpecialQuery.sql // => expectedTaxableSpecialQuery
taxableSpecialQuery.values // => [ true, 'special' ]

const nonTaxableQuery = mostRecentSalePricesQuery(false)

const expectedNonTaxableQuery = ['SELECT item.item_id, item.description, item.type, latest_sale.date AS latest_sale_date, latest_sale.price',
	'FROM item',
	'JOIN (',
	'\tSELECT item_sale.item_id, MAX(item_sale.date) AS `date`',
	'\tFROM item_sale',
	'\tWHERE taxable = ?',
	'\tGROUP BY item_sale.item_id',
	') AS latest_sale ON latest_sale.item_id = item.item_id'].join('\n')

nonTaxableQuery.sql // => expectedNonTaxableQuery
nonTaxableQuery.values // => [ false ]

```

## API

Because the [mysql](https://github.com/mysqljs/mysql) package already makes inserting so easy, this module is focused on `SELECT` queries.  I've implemented new clauses as I've needed them, and it's pretty well fleshed out at the moment.

If you need a clause added that is not implemented yet, feel free to open a pull request.  If you're not sure what the API should look like, open an issue and we can talk it through.

### Clauses

Every clause method returns a new immutable `q` query object.

- `q.select(expression1, expression2, etc)`
- `q.from(tablename | subquery, alias)`
- `q.join(tablename | subquery, [alias], on_expression)`
- `q.leftJoin(tablename | subquery, [alias], on_expression)`
- `q.where(expression, [[comparator], value])`
- `q.orWhere(expression, [[comparator], value])`
- `q.whereLike(expression, value)`
- `q.orWhereLike(expression, value)`
- `q.having(expression, [[comparator], value])`
- `q.orHaving(expression, [[comparator], value])`
- `q.groupBy(expression1, expression2, etc)`
- `q.orderBy(expression1, expression2, etc)`
- `q.limit(offset)`
- `q.forUpdate()`
- `q.lockInShareMode()`

`expression` strings are inserted without being parameterized, but you can also pass in [tagged template strings](#tagged-template-strings) to do anything special.

All `value`s will be automatically escaped.  If a `value` is `NULL` it will be automatically compared with `IS`, and if it's an array it will be automatically compared with `IN()`.  Otherwise, it will be compared with `=`.

```js
const whereInResult = q.select('fancy')
    .from('table')
    .where('table.pants', [ 'fancy', 'boring' ])
    .build()

const whereInQuery = 'SELECT fancy\n'
        + 'FROM table\n'
        + 'WHERE table.pants IN(?)'

whereInResult.sql // => whereInQuery

whereInResult.values // => [ [ 'fancy', 'boring' ] ]
```

All `value`s are automatically parameterized.  Put another way, calling `q.select('column1, column2')` is just as acceptable as calling `q.select('column1', 'column2')` and you should use whichever you prefer.

#### Clause order

Clauses are returned in the [correct order](https://github.com/TehShrike/sql-concat/blob/master/constants.js#L19-L35) no matter what order you call the methods in.

```js
q.from('table').select('column').toString() // `SELECT column\nFROM table``
```

However, if you call a method multiple times, the values are concatenated in the same order you called them.

```js
q.from('nifty')
	.select('snazzy')
	.select('spiffy')
	.select('sizzle')
	.toString() // `SELECT snazzy, spiffy, sizzle\nFROM nifty``
```

### `q.union(query)` and `q.unionAll(query)`

The `union` and `unionAll` methods return a query object that only contains `union` and `unionAll` methods – once you start unioning queries together, you can keep unioning more queries, but you can't add any other clauses to them.

### `q.build()`

Returns an object with these properties:

- `sql`: a string containing the query, with question marks `?` where escaped values should be inserted.
- `values`: an array of values to be used with the query.

You can pass this object directly to the `query` method of the [`mysql`](https://github.com/mysqljs/mysql#performing-queries) library:

```node
mysql.query(
	q.select('Cool!').build(),
	(err, result) => {
		console.log(result)
	}
)
```

```js
q.select('column')
	.where('id', 3)
	.build() // { sql: `SELECT column\nWHERE id = ?`, values: [ 3 ]}
```

### `q.toString()`

Returns a string with values escaped by [`sqlstring`](https://github.com/mysqljs/sqlstring#formatting-queries).

```js
q.select('fancy')
    .from('table')
    .where('table.pants', [ 'what\'s up', 'boring' ])
    .toString() // => `SELECT fancy\nFROM table\nWHERE table.pants IN('what\\'s up', 'boring')`
```

### Tagged template strings

sql-concat is also a template tag:

```js
const rainfall = 3
const templateTagResult = q`SELECT galoshes FROM puddle WHERE rain > ${ rainfall }`

templateTagResult.sql // => `SELECT galoshes FROM puddle WHERE rain > ?`
templateTagResult.values // => [ 3 ]
```

You can pass these results into any method as a value.  This allows you to properly parameterize function calls:

```js
const shoeSize = 9
const functionCallResult = q.select('rubbers')
	.from('puddle')
	.where('rain', '>', 4)
	.where('size', q`LPAD(${ shoeSize }, 2, '0')`)
	.build()

const functionCallQuery = `SELECT rubbers\n`
	+ `FROM puddle\n`
	+ `WHERE rain > ? AND size = LPAD(?, 2, '0')`

functionCallResult.sql // => functionCallQuery

functionCallResult.values // => [ 4, 9 ]
```

## Long-shot feature

Some syntax for generating nested clauses conditionally would be nice, so you could easily generate something like this dynamically:

```sql
WHERE important = ? AND (your_column = ? OR your_column = ? OR something_else LIKE ?)
```

Maybe something like:

```node
const whereCondition = q.parenthetical('OR')
	.equal('your_column', true)
	.equal('your_column', randomVariable)
	.like('something_else', anotherVariable)

const query = q.select('everything')
	.from('table')
	.where('important', true)
	.where(whereCondition)
```

You can discuss this feature in [Issue 3](https://github.com/TehShrike/sql-concat/issues/3) if you're interested.

## Running the tests

1. clone the repo
2. navigate to the cloned directory
3. `npm install`
4. `npm test`

## License

[WTFPL](http://wtfpl2.com)
