const TICKETS = base.getTable("Tickets")
const TICKETS_metaData = []

// for(let field of TICKETS.fields) {TICKETS_metaData.push(field.name)}

for (let field of TICKETS.fields) { TICKETS_metaData.push({ "name": field.name, "type": field.type }) }

console.log(TICKETS_metaData)
console.log(JSON.stringify(TICKETS_metaData, null, 2))
