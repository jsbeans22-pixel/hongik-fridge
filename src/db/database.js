import Dexie from 'dexie'

export const db = new Dexie('hongik-fridge')

db.version(1).stores({
  foods: 'id, startDate',
})