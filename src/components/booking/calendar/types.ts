export type Availability = {
  booked: string[] // czerwone
  unavailable: string[] // czarne
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
