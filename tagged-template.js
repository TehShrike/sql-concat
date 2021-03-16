module.exports = (queryParts, ...values) => {
	return queryParts.reduce(
		(queryObject, queryPart, i) => {
			queryObject.sql += queryPart

			if (i < values.length) {
				const nextValue = values[i]

				if (nextValue
					&& typeof nextValue === `object`
					&& typeof nextValue.sql === `string`
					&& Array.isArray(nextValue.values)
				) {
					queryObject.sql += `(${ nextValue.sql })`
					queryObject.values.push(...nextValue.values)
				} else {
					queryObject.sql += `?`
					queryObject.values.push(nextValue)
				}
			}

			return queryObject
		},
		{ sql: ``, values: [] },
	)
}
