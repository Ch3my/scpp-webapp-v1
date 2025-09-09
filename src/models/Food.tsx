import { DateTime } from 'luxon';

export type Food = {
    id: number
    name: string
    unit: string
    quantity: number | null
    lastTransactionAt: DateTime | null
}