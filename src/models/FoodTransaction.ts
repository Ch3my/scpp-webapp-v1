import { DateTime } from 'luxon';
import { Food } from './Food';
import type { components } from "@/api/schema";

/** Raw row as the API sends it (snake_case, ISO date strings). */
export type FoodTransactionWire = components["schemas"]["FoodTransaction"];

/** Write payloads are camelCase even though the read shape is snake_case. */
export type CreateFoodTransaction = components["schemas"]["CreateFoodTransaction"];
export type UpdateFoodTransaction = components["schemas"]["UpdateFoodTransaction"];

/**
 * View model, NOT the wire shape. The hooks camelCase the keys and turn
 * `occurred_at` / `best_before` into Luxon DateTimes.
 *
 * `note` and `code` are nullable on the wire. The previous hand-written type
 * declared them as plain `string`, which is why call sites already guard with
 * `item.code ?? ""` and `!row.original.code`.
 */
export type FoodTransaction = {
    id: number;
    itemId: number;
    changeQty: number;
    transactionType: 'restock' | 'consumption' | 'adjustment';
    occurredAt: DateTime;
    note: string | null;
    code: string | null;
    bestBefore: DateTime | null;
    food: Food | undefined;
    remainingQuantity: number | null;
    fkTransaction: number | null;
}
