// Edit the names in quotes
let table = base.getTable("Orders");
let view = table.getView("Step 1 to Step 2 - PCR");
let selectFieldName = "HTK Fulfillment Status"
let replacementValue = "PCR Step 2 - Scan Kit IDs + Tracking"

// No edits required below this line
let query = await view.selectRecordsAsync()
let records = query.records

let updates = records.map(record => {
  return {
    id: record.id,
    fields: {
      [selectFieldName]: { name: replacementValue }
    }
  }
})

while (updates.length > 0) {
  await table.updateRecordsAsync(updates.slice(0, 50));
  updates = updates.slice(50);
}