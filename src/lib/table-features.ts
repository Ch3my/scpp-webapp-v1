import {
    createFilteredRowModel,
    createSortedRowModel,
    filterFns,
    sortFns,
    stockFeatures,
    tableFeatures,
} from "@tanstack/react-table"

export const tableFeaturesConfig = tableFeatures({
    ...stockFeatures,
    sortedRowModel: createSortedRowModel(),
    filteredRowModel: createFilteredRowModel(),
    sortFns,
    filterFns,
})
