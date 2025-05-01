declare module 'sql-concat' {
	type Buildable = {
		build(): { sql: string, values: Value[] }
		toString(): string
	}

	type StringOrSubquery = string | Buildable

	type Unionable = {
		union(query: Buildable): Unionable
		unionAll(query: Buildable): Unionable
	} & Buildable

	type Value = string | number | null | object

	type Tag = (sql: TemplateStringsArray, ...values: any[]) => string

	export type Query = {
		select(...sql_expression: string[]): Query
		from(string_or_subquery: StringOrSubquery, alias?: string): Query
		join(string_or_subquery: StringOrSubquery, on_expression: string): Query
		join(string_or_subquery: StringOrSubquery, alias: string, on_expression: string): Query
		leftJoin(string_or_subquery: StringOrSubquery, on_expression: string): Query
		leftJoin(string_or_subquery: StringOrSubquery, alias: string, on_expression: string): Query
		where(sql_expression: string): Query
		where(sql_expression: string, value: Value): Query
		where(sql_expression: string, comparator: string, value: Value): Query
		orWhere(sql_expression: string): Query
		orwhere(sql_expression: string, value: Value): Query
		orWhere(sql_expression: string, comparator: string, value: Value): Query
		whereLike(sql_expression: string, value: Value): Query
		orWhereLike(sql_expression: string, value: Value): Query
		having(sql_expression: string): Query
		having(sql_expression: string, value: Value): Query
		having(sql_expression: string, comparator: string, value: Value): Query
		orHaving(sql_expression: string): Query
		orHaving(sql_expression: string, value: Value): Query
		orHaving(sql_expression: string, comparator: string, value: Value): Query
		groupBy(...sql_expression: string[]): Query
		orderBy(...sql_expression: string[]): Query
		limit(row_count: number): Query
		limit(offset: number, row_count: number): Query
		forUpdate(): Query
		lockInShareMode(): Query
	} & Buildable & Unionable & Tag

	const query: Query

	export default query
}
