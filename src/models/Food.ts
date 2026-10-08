import { DateTime } from 'luxon';
import type { components } from "@/api/schema";

/** Raw rows as the API sends them. */
export type FoodItemWire = components["schemas"]["FoodItem"];
export type FoodItemQuantityWire = components["schemas"]["FoodItemQuantity"];

/**
 * View model, NOT the wire shape. The API sends snake_case
 * `last_transaction_at` as an ISO string; the conversion to Luxon happens once
 * in the query hooks so components never deal with both representations.
 *
 * `quantity` is null for rows from GET /food/items, which carries only
 * id/name/unit - only /food/item-quantity reports a quantity.
 */
export type Food = {
    id: number
    name: string
    unit: string
    quantity: number | null
    lastTransactionAt: DateTime | null
}
