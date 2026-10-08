import { useMemo, useState, type ReactNode } from 'react';
import { CirclePlus, CircleMinus, FilePenLine, ListRestart, MoreHorizontal, Trash } from 'lucide-react';
import numeral from 'numeral';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    DataCardHeader,
    DataCardMeta,
    DataCardList,
} from '@/components/mobile/DataCardList';

import { ComboboxAlimentos } from '@/components/ComboboxAlimentos';
import FoodItemRecord from '@/components/FoodItemRecord';
import FoodTransactionRecord from '@/components/FoodTransactionRecord';

import { Food } from '@/models/Food';
import { FoodTransaction } from '@/models/FoodTransaction';
import {
    useFoodItemQuantity,
    useFoodTransactions,
    useDeleteFoodItem,
    useDeleteFoodTransaction,
    useAdjustTransactionQty,
} from '@/api/hooks';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
    calculateIcon,
    TransactionCodeBadge,
    TransactionTypeBadge,
} from '@/table-columns-def/food-transactions-columns';

/**
 * A labelled figure. The card previously showed these numbers bare, which is
 * why it was not obvious which one was the cantidad - the desktop table has
 * column headers doing this job.
 */
function Stat({
    label,
    value,
    tone,
}: {
    label: string;
    value: ReactNode;
    tone?: string;
}) {
    return (
        <div className="min-w-0">
            <div className="text-muted-foreground text-sm">{label}</div>
            <div className={cn('truncate text-base font-semibold tabular-nums', tone)}>
                {value}
            </div>
        </div>
    );
}

type Tab = 'inventario' | 'transacciones';

/**
 * The desktop screen's two panes become two tabs. Both panes' data comes from
 * the same hooks, so switching tabs costs nothing after the first load.
 */
const MobileFoodScreen = () => {
    const [tab, setTab] = useState<Tab>('inventario');

    // Inventario
    const [itemFilter, setItemFilter] = useState(0);
    const [openFoodItemDialog, setOpenFoodItemDialog] = useState(false);
    const [selectedFoodItemId, setSelectedFoodItemId] = useState(0);

    // Transacciones
    const [transactionItemFilter, setTransactionItemFilter] = useState(0);
    const [codeFilter, setCodeFilter] = useState('');
    const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<FoodTransaction | null>(null);

    const { data: foods = [], isLoading: isLoadingFoods } = useFoodItemQuantity();
    const { data: transactions = [], isLoading: isLoadingTransactions } =
        useFoodTransactions(transactionItemFilter);

    const deleteFoodItem = useDeleteFoodItem();
    const deleteTransaction = useDeleteFoodTransaction();
    const adjustQty = useAdjustTransactionQty();

    const visibleFoods = useMemo(
        () => (itemFilter === 0 ? foods : foods.filter((f) => f.id === itemFilter)),
        [foods, itemFilter]
    );

    const visibleTransactions = useMemo(() => {
        const needle = codeFilter.trim().toLowerCase();
        if (needle === '') return transactions;
        return transactions.filter((t) => (t.code ?? '').toLowerCase().includes(needle));
    }, [transactions, codeFilter]);

    const removeFoodItem = (food: Food) => {
        deleteFoodItem.mutate(food.id, {
            onSuccess: () => toast('Item eliminado'),
            onError: (error) =>
                toast.error('Error al eliminar el item: ' + getApiErrorMessage(error)),
        });
    };

    const removeTransaction = (transaction: FoodTransaction) => {
        deleteTransaction.mutate(transaction.id, {
            onSuccess: () => toast('Transacción eliminada'),
            onError: (error) =>
                toast('Error al guardar la transacción ' + getApiErrorMessage(error)),
        });
    };

    const subtractOne = (transaction: FoodTransaction) => {
        adjustQty.mutate(
            { id: transaction.id, changeQty: transaction.changeQty },
            {
                onSuccess: () => toast('Cantidad actualizada'),
                onError: (error) =>
                    toast('Error al guardar la transacción ' + getApiErrorMessage(error)),
            }
        );
    };

    return (
        <div className="flex flex-col gap-3 p-3">
            {/* Segmented control rather than a Tabs primitive - the project has
                no tabs component and this needs no new dependency. */}
            <div role="tablist" className="bg-muted flex rounded-lg p-1">
                {(
                    [
                        ['inventario', 'Inventario'],
                        ['transacciones', 'Transacciones'],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        onClick={() => setTab(value)}
                        className={cn(
                            'min-h-10 flex-1 rounded-md text-sm font-medium',
                            tab === value
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'inventario' ? (
                <>
                    <div className="flex gap-2">
                        <Button
                            className="min-h-11"
                            aria-label="Nuevo producto"
                            onClick={() => {
                                setSelectedFoodItemId(0);
                                setOpenFoodItemDialog(true);
                            }}
                        >
                            <CirclePlus />
                        </Button>
                        <Button
                            variant="outline"
                            className="min-h-11"
                            aria-label="Limpiar filtro"
                            onClick={() => setItemFilter(0)}
                        >
                            <ListRestart />
                        </Button>
                        <div className="min-w-0 flex-1">
                            <ComboboxAlimentos value={itemFilter} onChange={setItemFilter} />
                        </div>
                    </div>

                    <DataCardList
                        items={visibleFoods}
                        isLoading={isLoadingFoods}
                        getKey={(food) => food.id}
                        emptyMessage="Sin productos"
                        action={(food) => (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="size-9 p-0"
                                        aria-label={'Acciones para ' + food.name}
                                    >
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setTransactionItemFilter(food.id);
                                            setTab('transacciones');
                                        }}
                                    >
                                        Ver detalle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedFoodItemId(food.id);
                                            setOpenFoodItemDialog(true);
                                        }}
                                    >
                                        <FilePenLine className="mr-2 size-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => removeFoodItem(food)}>
                                        <Trash className="mr-2 size-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        renderCard={(food) => (
                            <>
                                <DataCardHeader
                                    title={food.name}
                                    trailing={
                                        <span className="font-semibold">
                                            {numeral(food.quantity).format('0,0')}{' '}
                                            <span className="text-muted-foreground text-sm font-normal">
                                                {food.unit}
                                            </span>
                                        </span>
                                    }
                                />
                                <DataCardMeta>
                                    <span>
                                        Actividad:{' '}
                                        {food.lastTransactionAt?.toFormat('dd-MM-yyyy') ?? '—'}
                                    </span>
                                </DataCardMeta>
                            </>
                        )}
                    />
                </>
            ) : (
                <>
                    <div className="flex gap-2">
                        <Button
                            className="min-h-11"
                            aria-label="Nueva transacción"
                            onClick={() => {
                                setSelectedTransaction(null);
                                setOpenTransactionDialog(true);
                            }}
                        >
                            <CirclePlus />
                        </Button>
                        <Button
                            variant="outline"
                            className="min-h-11"
                            aria-label="Limpiar filtros"
                            onClick={() => {
                                setTransactionItemFilter(0);
                                setCodeFilter('');
                            }}
                        >
                            <ListRestart />
                        </Button>
                        <div className="min-w-0 flex-1">
                            <ComboboxAlimentos
                                value={transactionItemFilter}
                                onChange={setTransactionItemFilter}
                            />
                        </div>
                    </div>

                    <Input
                        placeholder="Buscar por código..."
                        value={codeFilter}
                        onChange={(event) => setCodeFilter(event.target.value)}
                        className="min-h-11"
                    />

                    <DataCardList
                        items={visibleTransactions}
                        isLoading={isLoadingTransactions}
                        getKey={(transaction) => transaction.id}
                        emptyMessage="Sin transacciones"
                        onItemClick={(transaction) => {
                            setSelectedTransaction(transaction);
                            setOpenTransactionDialog(true);
                        }}
                        action={(transaction) => (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="size-9 p-0"
                                        aria-label={'Acciones para ' + (transaction.food?.name ?? 'transacción')}
                                    >
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => subtractOne(transaction)}>
                                        <CircleMinus className="mr-2 size-4" />
                                        Restar uno
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => removeTransaction(transaction)}>
                                        <Trash className="mr-2 size-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        renderCard={(transaction) => {
                            const expiring = calculateIcon(transaction.bestBefore);
                            return (
                                <>
                                    {/*
                                      * Two bands: an identity block (what it is) over
                                      * a measurements row (the numbers), split by a
                                      * rule. Every label/value pair uses the same
                                      * label-above-value shape - the card previously
                                      * mixed three different ones, which is what made
                                      * it read as unorganised.
                                      *
                                      * Codigo takes the prominent right slot because
                                      * tipo is almost always Reposición.
                                      */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-base font-medium">
                                                {transaction.food?.name ?? '—'}
                                            </div>
                                            <div className="mt-1.5">
                                                <TransactionTypeBadge
                                                    transactionType={transaction.transactionType}
                                                    className="px-2 py-0 text-sm font-normal"
                                                />
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-muted-foreground text-sm">
                                                Código
                                            </div>
                                            <div className="mt-1.5">
                                                <TransactionCodeBadge
                                                    code={transaction.code}
                                                    className="px-2.5 py-0.5 text-base font-semibold tabular-nums"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-border mt-3 grid grid-cols-3 gap-2 border-t pt-3">
                                        <Stat
                                            label="Cantidad"
                                            value={
                                                <>
                                                    {numeral(transaction.changeQty).format('0,0')}
                                                    <span className="text-muted-foreground text-sm font-normal">
                                                        {' '}
                                                        {transaction.food?.unit}
                                                    </span>
                                                </>
                                            }
                                        />
                                        <Stat
                                            label="Queda"
                                            value={
                                                transaction.remainingQuantity !== null
                                                    ? numeral(transaction.remainingQuantity).format('0,0')
                                                    : '—'
                                            }
                                        />
                                        {/* The date that actually matters here, so it
                                            turns red once the skull threshold hits. */}
                                        <Stat
                                            label="Vence"
                                            tone={expiring ? 'text-red-600 dark:text-red-400' : undefined}
                                            value={
                                                <span className="flex items-center gap-1">
                                                    {transaction.bestBefore?.toFormat('dd-MM-yy') ?? '—'}
                                                    {expiring}
                                                </span>
                                            }
                                        />
                                    </div>
                                </>
                            );
                        }}
                    />
                </>
            )}

            <FoodItemRecord
                key={selectedFoodItemId}
                id={selectedFoodItemId}
                isOpen={openFoodItemDialog}
                hideButton={true}
                onOpenChange={(isOpen) => {
                    setOpenFoodItemDialog(isOpen);
                    if (!isOpen) setSelectedFoodItemId(0);
                }}
            />
            <FoodTransactionRecord
                initialData={selectedTransaction}
                isOpen={openTransactionDialog}
                hideButton={true}
                onOpenChange={(isOpen) => {
                    setOpenTransactionDialog(isOpen);
                    if (!isOpen) setSelectedTransaction(null);
                }}
            />
        </div>
    );
};

export default MobileFoodScreen;
