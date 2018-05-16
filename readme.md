# sql-concat

A MySQL query builder.

[![Build Status](https://travis-ci.org/TehShrike/sql-concat.svg)](https://travis-ci.org/TehShrike/sql-concat)

```
const q = require('sql-concat')
```

## Designed to...

- Build queries programmatically
- Eliminate some query boilerplate and provide a better syntax than a big 'ol concatenated string (at least until I start making use of ES6 template strings)
- Allow simpler combining of query parts and their associated parameters than one long query string followed by a long array of parameter values

## Other features

- Easily compose query parts - the query-builder object is immutable, so you can build up a base query and re-use it over and over again with small modifications (add where clauses or joins conditionally, for example)
- Builds queries for [mysqljs/mysql](https://github.com/mysqljs/mysql) (specifically, by expecting its [rules for query values](https://github.com/mysqljs/mysql#escaping-query-values) instead of MySQL's stored procedure parameters)
- Not as overblown as [knex](http://knexjs.org/), and allows more freedom in using string literals within query chunks
- Queries should look good when printed out (newlines between clauses, subqueries indented with tabs)

## Looks like

<!--js
var q = require('./')
-->

```js
const result = q.select('table1.some_boring_id, table2.something_interesting, mystery_table.surprise')
	.from('table1')
	.join('table2', 'table1.some_boring_id = table2.id')
	.leftJoin('mystery_table', 'mystery_table.twister_reality = table2.probably_null_column')
	.where('table1.pants', 'fancy')
	.where('table1.britches', '>', 99)
	.build()

const expectedQuery = 'SELECT table1.some_boring_id, table2.something_interesting, mystery_table.surprise\n'
		+ 'FROM table1\n'
		+ 'JOIN table2 ON table1.some_boring_id = table2.id\n'
		+ 'LEFT JOIN mystery_table ON mystery_table.twister_reality = table2.probably_null_column\n'
		+ 'WHERE table1.pants = ? AND table1.britches > ?'

result.str // => expectedQuery

result.params // => [ 'fancy', 99 ]

```

## A cooler example

Showing off the composability/reusability of the query objects, plus some dynamic query building:

```js

// A partial query that we can just leave here to reuse later:
const MOST_RECENT_SALE = q.select('item_sale.item_id, MAX(item_sale.date) AS `date`')
	.from('item_sale')
	.groupBy('item_sale.item_id')

function mostRecentSalePricesQuery(taxable, itemType) {
	var subquery = MOST_RECENT_SALE.where('taxable', taxable)

	var query = q.select('item.item_id, item.description, item.type, latest_sale.date AS latest_sale_date, latest_sale.price')
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

taxableSpecialQuery.str // => expectedTaxableSpecialQuery
taxableSpecialQuery.params // => [ true, 'special' ]

const nonTaxableQuery = mostRecentSalePricesQuery(false)

const expectedNonTaxableQuery = ['SELECT item.item_id, item.description, item.type, latest_sale.date AS latest_sale_date, latest_sale.price',
	'FROM item',
	'JOIN (',
	'\tSELECT item_sale.item_id, MAX(item_sale.date) AS `date`',
	'\tFROM item_sale',
	'\tWHERE taxable = ?',
	'\tGROUP BY item_sale.item_id',
	') AS latest_sale ON latest_sale.item_id = item.item_id'].join('\n')

nonTaxableQuery.str // => expectedNonTaxableQuery
nonTaxableQuery.params // => [ false ]

```

## API so far

Because [node-mysql](https://github.com/felixge/node-mysql) already makes inserting so easy, this module is focused on `SELECT` queries.  I've implemented new clauses as I've needed them, and it's pretty well fleshed out at the moment.

If you need a clause added that is not implemented yet, feel free to open a pull request.  If you're not sure what the API should look like, open an issue and we can talk it through.

- `q.select(column1, column2, etc)`
- `q.from(tablename | subquery, alias)`
- `q.join(tablename | subquery, [alias], on)`
- `q.leftJoin(tablename | subquery, [alias], on)`
- `q.where(column, [comparitor], value)`
- `q.orWhere(column, [comparitor], value)`
- `q.whereLike(column, value)`
- `q.orWhereLike(column, value)`
- `q.having(column, [comparitor], value)`
- `q.orHaving(column, [comparitor], value)`
- `q.groupBy(column1, column2, etc)`
- `q.orderBy(column1, column2, etc)`
- `q.limit(offset)`
- `q.forUpdate()`
- `q.lockInShareMode()`

All of the column/table fields are just strings that aren't escaped or fiddled with in any way, so you can add aliases or whatnot without worrying that you're going to break some query parser.

If `value` is `NULL` it will be automatically compared with `IS`, and if it's an array it will be automatically compared with `IN()`:

```js
const whereInResult = q.select('fancy')
    .from('table')
    .where('table.pants', [ 'fancy', 'boring' ])
    .build()

const whereInQuery = 'SELECT fancy\n'
        + 'FROM table\n'
        + 'WHERE table.pants IN(?)'

whereInResult.str // => whereInQuery

whereInResult.params // => [ [ 'fancy', 'boring' ] ]
```

Put another way, calling `q.select('column1, column2')` is just as acceptable as calling `q.select('column1', 'column2')` and you should use whichever you prefer.

## To do:

- [Issue 2](https://github.com/TehShrike/sql-concat/issues/2): calling MySQL functions with dynamic parameters as arguments `WHERE some_column = LPAD(other_column, ?, ?)`
- [Issue 3](https://github.com/TehShrike/sql-concat/issues/3): nested parenthetical groupings `WHERE some_column = ? AND (other_column = ? OR other_column = ?)`

Chime in if you're interested.

## Running the tests

1. clone the repo
2. navigate to the cloned directory
3. `npm install`
4. `npm test`

## License

[WTFPL](http://wtfpl2.com)
