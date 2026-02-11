export type Availability = {
  booked: string[] // czerwone (full)
  unavailable: string[] // czarne (blokady/0 stock)
  remainingByDay?: Record<string, number> // ✅ ile sztuk zostaje na dzień (0..stock)
  stock?: number // ✅ stock zasobu
}


export type DayStatus = 'available' | 'booked' | 'unavailable'

export type CalendarCell = {
  date: Date | null
  iso: string | null
}

export type IsoRange = {
  from: string
  to: string
}
