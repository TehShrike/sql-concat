import sqlString from 'sqlstring'
import { build } from './build-logic.js'

const combinableType = {
	text: `text`,
	clauses: `clauses`,
}

const buildCombinable = (combinableArray, joinedBy = `\n`) => combinableArray.map(({ type, clauses, text }) => {
	if (type === combinableType.text) {
		return { sql: text, values: [] }
	} else if (type === combinableType.clauses) {
		return build(clauses, joinedBy)
	}

	throw new Error(`TehShrike messed up and somehow referenced a combinable type that isn't supported: "${type}"`)
}).reduce((combined, { sql, values }) => {
	if (combined) {
		return {
			sql: combined.sql + joinedBy + sql,
			values: [
				...combined.values,
				...values,
			],
		}
	} else {
		return {
			sql,
			values,
		}
	}
}, null)

const makeCombinableQueries = combinableArray => ({
	union: ({ getClauses }) => makeCombinableQueries([
		...combinableArray,
		{ text: `UNION`, type: combinableType.text },
		{ clauses: getClauses(), type: combinableType.clauses },
	]),
	unionAll: ({ getClauses }) => makeCombinableQueries([
		...combinableArray,
		{ text: `UNION ALL`, type: combinableType.text },
		{ clauses: getClauses(), type: combinableType.clauses },
	]),
	build: joinedBy => buildCombinable(combinableArray, joinedBy),
	toString: joinedBy => {
		const { sql, values } = buildCombinable(combinableArray, joinedBy)
		return sqlString.format(sql, values)
	},
})

const combineClauses = (clausesA, combineText, clausesB) => makeCombinableQueries([
	{ clauses: clausesA, type: combinableType.clauses },
	{ text: combineText, type: combinableType.text },
	{ clauses: clausesB, type: combinableType.clauses },
])

export { combineClauses }
