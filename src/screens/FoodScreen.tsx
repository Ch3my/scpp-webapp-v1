import React, { useRef } from 'react';
import { CirclePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { FoodScreenTable } from '@/components/FoodScreenTable';
import { ComboboxAlimentos } from '@/components/ComboboxAlimentos';

import { useAppState } from '@/AppState';
import ScreenTitle from '@/components/ScreenTitle';

import FoodTransactions, { FoodTransactionsRef } from '@/components/FoodTransactions';
import FoodItemRecord from '@/components/FoodItemRecord';
import FoodTransactionRecord from '@/components/FoodTransactionRecord';

import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';

const FoodScreen: React.FC = () => {
    const { apiPrefix, sessionId } = useAppState()
    const queryClient = useQueryClient();
    const [openFoodItemDialog, setOpenFoodItemDialog] = React.useState<boolean>(false);
    const [openFoodTransactionDialog, setOpenFoodTransactionDialog] = React.useState<boolean>(false);
    const foodTransactionRef = useRef<FoodTransactionsRef>(null);
    const [selectedFoodItemId, setSelectedFoodItemId] = React.useState<number>(0);
    const [selectedFoodTransactionId, setSelectedFoodTransactionId] = React.useState<number>(0);
    const [foodItemIdFilter, setFoodItemIdFilter] = React.useState<number>(0);
    const [codeFilter, setCodeFilter] = React.useState<string>("");

    const foodTransactionDialogEvent = (isOpen: boolean) => {
        setOpenFoodTransactionDialog(isOpen)
        if (!isOpen) {
            queryClient.invalidateQueries({ queryKey: ['foods'] });
            foodTransactionRef.current?.refetch()
            setSelectedFoodTransactionId(0)
        }
    }
    const newFoodItemDialogEvent = (isOpen: boolean) => {
        setOpenFoodItemDialog(isOpen)
        if (!isOpen) {
            queryClient.invalidateQueries({ queryKey: ['foods'] });
            setTimeout(() => {
                setSelectedFoodItemId(0) // Reset the selected food item ID
            }, 100); // Delay to allow the dialog to close before reset that change text inside the dialog
        }
    }

    const editFoodTransaction = async (id: number) => {
        setSelectedFoodTransactionId(id)
        setOpenFoodTransactionDialog(true)
    }

    return (
        <div className="grid gap-4 p-2 w-screen h-screen overflow-hidden" style={{ gridTemplateColumns: "1fr 2fr" }}>
            <div className='flex flex-col gap-2 overflow-y-auto'>
                <ScreenTitle title='Food Storage' />
                <div className='flex gap-2'>
                    <Button variant="outline" onClick={() => {
                        setOpenFoodItemDialog(!openFoodItemDialog)
                    }}><CirclePlus /></Button>
                </div>
                <FoodScreenTable
                    apiPrefix={apiPrefix}
                    sessionId={sessionId}
                    onEditFoodItem={setSelectedFoodItemId}
                    onOpenFoodItemDialog={setOpenFoodItemDialog}
                />
            </div>
            <div className='flex flex-col gap-2 overflow-auto'>
                <ScreenTitle title='Transacciones' />
                <div className='flex items-center justify-between'>
                    <div className='flex gap-2'>
                        <Button variant="outline" onClick={() => {
                            setOpenFoodTransactionDialog(!openFoodTransactionDialog)
                        }}><CirclePlus /></Button>
                        <ComboboxAlimentos
                            value={foodItemIdFilter}
                            onChange={setFoodItemIdFilter}
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
                    <FoodTransactions ref={foodTransactionRef}
                        onTransactionEdit={(id) => { editFoodTransaction(id) }}
                        foodItemIdFilter={foodItemIdFilter}
                        codeFilter={codeFilter}
                    />
                </div>
            </div>
            <FoodItemRecord onOpenChange={newFoodItemDialogEvent} id={selectedFoodItemId} isOpen={openFoodItemDialog} hideButton={true} />
            <FoodTransactionRecord onOpenChange={foodTransactionDialogEvent} id={selectedFoodTransactionId} isOpen={openFoodTransactionDialog} hideButton={true} />
        </div>
    );
};

export default FoodScreen;