import { useState, useTransition, useDeferredValue } from 'react';
import { CirclePlus, ListRestart } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { FoodSummary } from '@/components/FoodSummary';
import { ComboboxAlimentos } from '@/components/ComboboxAlimentos';

import ScreenTitle from '@/components/ScreenTitle';

import FoodTransactions from '@/components/FoodTransactions';
import FoodItemRecord from '@/components/FoodItemRecord';
import FoodTransactionRecord from '@/components/FoodTransactionRecord';

import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FoodTransaction } from '@/models/FoodTransaction';

const FoodScreen = () => {
    const [openFoodItemDialog, setOpenFoodItemDialog] = useState(false);
    const [openFoodTransactionDialog, setOpenFoodTransactionDialog] = useState(false);
    const [selectedFoodItemId, setSelectedFoodItemId] = useState(0);
    const [selectedFoodTransaction, setSelectedFoodTransaction] = useState<FoodTransaction | null>(null);
    const [foodItemIdFilter, setFoodItemIdFilter] = useState(0);
    const [codeFilter, setCodeFilter] = useState("");
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [foodSummaryFilter, setFoodSummaryFilter] = useState(0);
    const [foodSummaryComboboxOpen, setFoodSummaryComboboxOpen] = useState(false);

    // useTransition for filter changes - keeps Food Storage side responsive
    const [, startFilterTransition] = useTransition();

    // useDeferredValue for code filter - keeps typing fluid
    const deferredCodeFilter = useDeferredValue(codeFilter);

    const foodTransactionDialogEvent = (isOpen: boolean) => {
        setOpenFoodTransactionDialog(isOpen)
        if (!isOpen) {
            setSelectedFoodTransaction(null)
        }
    }

    const newFoodItemDialogEvent = (isOpen: boolean) => {
        setOpenFoodItemDialog(isOpen)
        if (!isOpen) {
            setSelectedFoodItemId(0)
        }
    }

    const editFoodTransaction = (transaction: FoodTransaction) => {
        setSelectedFoodTransaction(transaction)
        setOpenFoodTransactionDialog(true)
    }

    return (
        <div className="grid gap-4 p-2 w-screen h-screen overflow-hidden" style={{ gridTemplateColumns: "1fr auto 2fr" }}>
            <div className='flex flex-col gap-2 overflow-y-auto'>
                <ScreenTitle title='Food Storage' />
                <div className='flex gap-2'>
                    <Button variant="outline" onClick={() => {
                        setOpenFoodItemDialog(!openFoodItemDialog)
                    }}><CirclePlus /></Button>
                    <Button variant="outline" onClick={() => {
                        startFilterTransition(() => setFoodSummaryFilter(0));
                    }}>
                        <ListRestart />
                    </Button>
                    <ComboboxAlimentos
                        value={foodSummaryFilter}
                        onChange={(value) => startFilterTransition(() => setFoodSummaryFilter(value))}
                        open={foodSummaryComboboxOpen}
                        onOpenChange={setFoodSummaryComboboxOpen}
                    />
                </div>
                <FoodSummary
                    onEditFoodItem={setSelectedFoodItemId}
                    onOpenFoodItemDialog={setOpenFoodItemDialog}
                    foodItemIdFilter={foodSummaryFilter}
                    onViewDetail={(id) => startFilterTransition(() => setFoodItemIdFilter(id))}
                />
            </div>
            <Separator orientation="vertical" className="h-auto" />
            <div className='flex flex-col gap-2 overflow-auto'>
                <ScreenTitle title='Transacciones' />
                <div className='flex items-center justify-between'>
                    <div className='flex gap-2'>
                        <Button variant="outline" onClick={() => {
                            setOpenFoodTransactionDialog(!openFoodTransactionDialog)
                        }}><CirclePlus /></Button>
                        <Button variant="outline" onClick={() => {
                            startFilterTransition(() => setFoodItemIdFilter(0));
                            setCodeFilter("");
                        }}>
                            <ListRestart />
                        </Button>
                        <ComboboxAlimentos
                            value={foodItemIdFilter}
                            onChange={(value) => startFilterTransition(() => setFoodItemIdFilter(value))}
                            open={comboboxOpen}
                            onOpenChange={setComboboxOpen}
                        />
                        <Input
                            placeholder="Buscar por código..."
                            value={codeFilter}
                            onChange={(event) => setCodeFilter(event.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </div>
                <div className='overflow-y-auto'>
                    <FoodTransactions
                        onTransactionEdit={editFoodTransaction}
                        foodItemIdFilter={foodItemIdFilter}
                        codeFilter={deferredCodeFilter}
                    />
                </div>
            </div>
            <FoodItemRecord key={selectedFoodItemId} onOpenChange={newFoodItemDialogEvent} id={selectedFoodItemId} isOpen={openFoodItemDialog} hideButton={true} />
            <FoodTransactionRecord onOpenChange={foodTransactionDialogEvent} initialData={selectedFoodTransaction} isOpen={openFoodTransactionDialog} hideButton={true} />
        </div>
    );
};

export default FoodScreen;