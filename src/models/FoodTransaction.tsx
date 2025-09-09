import { DateTime } from 'luxon';
import { Food } from './Food';

export type FoodTransaction = {
    id: number;
    itemId: number;
    changeQty: number;
    transactionType: 'restock' | 'consumption' | 'adjustment';
    occurredAt: DateTime; 
    note: string;
    code: string;
    bestBefore: DateTime | null; 
    food: Food | undefined;
    remainingQuantity: number | null;
    fkTransaction: number | null; 
  }