module.exports = (queryParts, ...values) => {
	const query = queryParts.reduce(
		(queryObject, queryPart, i) => {
			queryObject.str += queryPart

			if (i < values.length) {
				const nextValue = values[i]

				if (nextValue
					&& typeof nextValue === `object`
					&& typeof nextValue.sql === `string`
					&& Array.isArray(nextValue.values)
				) {
					queryObject.str += `(${ nextValue.sql })`
					queryObject.params.push(...nextValue.values)
				} else {
					queryObject.str += `?`
					queryObject.params.push(nextValue)
				}
			}

			return queryObject
		},
		{ str: ``, params: [] },
	)

	return Object.assign(query, {
		sql: query.str,
		values: query.params,
	})
}
