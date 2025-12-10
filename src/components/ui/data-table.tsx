"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
} from "@tanstack/react-table"
import { useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    pageCount?: number
    pageSize?: number
    pageIndex?: number
    onPageChange?: (page: number) => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            // If server-side pagination, we manage pageIndex manually, but here let's stick to client-side first or mixed.
        },
        // If we want fully controlled pagination:
        // manualPagination: !!onPageChange,
        // pageCount: pageCount ?? -1,
    })

    // Hack for simpler client-side pagination for now if onPageChange is not provided
    // Or if onPageChange is provided, we assume server-side control outside this component
    // to keep it simple, let's just rely on TanStack default client side for small data

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="group relative transition-colors hover:bg-muted/50"
                                >
                                    {row.getVisibleCells().map((cell, index) => (
                                        <TableCell key={cell.id} className={index === 0 ? "relative" : ""}>
                                            {/* Accent bar on first cell */}
                                            {index === 0 && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 overflow-hidden">
                                                    <div className="h-full w-full bg-gradient-to-b from-primary via-primary to-purple-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                                                </div>
                                            )}
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Không có dữ liệu.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Tiếp
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
