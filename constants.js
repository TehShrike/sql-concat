const clauseKeyToString = {
	select: `SELECT`,
	insert: `INSERT INTO`,
	onDuplicate: `ON DUPLICATE KEY UPDATE`,
	values: `VALUES`,
	update: `UPDATE`,
	set: `SET`,
	from: `FROM`,
	join: ``,
	where: `WHERE`,
	groupBy: `GROUP BY`,
	having: `HAVING`,
	orderBy: `ORDER BY`,
	limit: `LIMIT`,
	delete: `DELETE`,
	lock: ``,
}

const clauseOrder = [
	`select`,
	`insert`,
	`delete`,
	`values`,
	`update`,
	`set`,
	`from`,
	`join`,
	`where`,
	`onDuplicate`,
	`groupBy`,
	`having`,
	`orderBy`,
	`limit`,
	`lock`,
]

const startingClauses = {
	select: [],
	insert: [],
	onDuplicate: [],
	values: [],
	update: [],
	set: [],
	from: [],
	join: [],
	where: [],
	groupBy: [],
	having: [],
	orderBy: [],
	limit: [],
	delete: [],
	lock: [],
}

export {
	clauseOrder,
	clauseKeyToString,
	startingClauses,
}
