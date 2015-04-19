# sql-concat

A MySQL query builder.

[![Build Status](https://travis-ci.org/TehShrike/sql-concat.svg)](https://travis-ci.org/TehShrike/sql-concat)

## Designed to...

- Build queries programmatically
- Eliminate some query boilerplate and provide a better syntax than a big 'ol concatenated string (at least until I start making use of ES6 template strings)
- Allow simpler combining of query parts and their associated parameters than one long query string followed by a long array of parameter values

## Other features

- Easily compose query parts - the query-builder object is immutable, so you can build up a base query and re-use it over and over again with small modifications (add where clauses or joins conditionally, for example)
- Builds queries for [node-mysql](https://github.com/felixge/node-mysql) (specifically, by expecting its [rules for query values](https://github.com/felixge/node-mysql#escaping-query-values) instead of MySQL's stored procedure parameters)
- Not as overblown as [knex](http://knexjs.org/), and allows more freedom in using string literals within query chunks
- Queries should look good when printed out (newlines between clauses, subqueries indented with tabs)

## Looks like

```js

var q = require('./')

var result = q.select('table1.some_boring_id, table2.something_interesting, mystery_table.surprise')
	.from('table1')
	.join('table2', 'table1.some_boring_id = table2.id')
	.join('mystery_table', 'mystery_table.twister_reality = table2.probably_null_column', 'LEFT')
	.where('table1.pants', 'fancy')
	.build()

var expectedQuery = 'SELECT table1.some_boring_id, table2.something_interesting, mystery_table.surprise\n'
		+ 'FROM table1\n'
		+ 'JOIN table2 ON table1.some_boring_id = table2.id\n'
		+ 'LEFT JOIN mystery_table ON mystery_table.twister_reality = table2.probably_null_column\n'
		+ 'WHERE table1.pants = ?'

result.str // => expectedQuery

result.params // => [ 'fancy' ]

```

## Work in progress

A lot of clauses are unimplemented as of this commit.  I'll be implementing them as I need them.

If you want to start using it now and need to add something, feel free - you should just need to edit the `q` function in [query-object.js](https://github.com/TehShrike/sql-concat/blob/master/query-object.js), and maybe add a new function to [clause-handlers.js](https://github.com/TehShrike/sql-concat/blob/master/clause-handlers.js).

Adding a new test for your additions would be appreciated, but don't let that stop you from just opening the file and making some changes!

## API so far

- `q.select(column1, column2, etc)`
- `q.from(tablename | subquery, alias)`
- `q.join(tablename | subquery, [alias], on)`
- `q.leftJoin(tablename | subquery, [alias], on)`
- `q.where(column, value)`
- `q.orWhere(column, value)`
- `q.having(column, value)`
- `q.orHaving(column, value)`

All of the column/table fields are just strings that aren't escaped or fiddled with in any way, so you can add aliases or whatnot without worrying that you're going to break some query parser.

Put another way, calling `q.select('column1, column2')` is just as acceptable as calling `q.select('column1', 'column2')` and you should use whichever you prefer.

## Running the tests

1. clone the repo
2. run `npm install` in the cloned directory
3. run `npm test`

## License

[WTFPL](http://wtfpl2.com)
