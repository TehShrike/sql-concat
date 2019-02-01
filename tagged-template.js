module.exports = (queryParts, ...values) => {
	const query = queryParts.reduce(
		(queryObject, queryPart, i) => {
			queryObject.str += queryPart

			if (i < values.length) {
				queryObject.str += `?`
				queryObject.params.push(values[i])
			}

			return queryObject
		},
		{ str: ``, params: [] }
	)

	return Object.assign(query, {
		sql: query.str,
		values: query.params,
	})
}