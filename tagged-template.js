module.exports = (queryParts, ...values) =>
	queryParts.reduce(
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
