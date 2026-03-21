"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Eye, MoreHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const createColumns = (onView) => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
        {row.getValue("id")}
      </div>
    ),
  },
  {
    accessorKey: "user_first_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        User Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-gray-800 dark:text-gray-200">
        {row.getValue("user_first_name") || row.getValue("user_rwandan_name") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "user_email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-gray-700 dark:text-gray-300">
        {row.getValue("user_email") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "family_name",
    header: "Family",
    cell: ({ row }) => (
      <div className="text-gray-700 dark:text-gray-300">
        {row.getValue("family_name") || "-"} {row.original.family_number ? `(#${row.original.family_number})` : ""}
      </div>
    ),
  },
  {
    accessorKey: "origin_district",
    header: "Origin District",
    cell: ({ row }) => (
      <div className="text-gray-700 dark:text-gray-300">
        {row.getValue("origin_district") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "current_country",
    header: "Current Country",
    cell: ({ row }) => (
      <div className="text-gray-700 dark:text-gray-300">
        {row.getValue("current_country") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "graduation_status",
    header: "Graduation",
    cell: ({ row }) => (
      <div className="text-gray-700 dark:text-gray-300">
        {row.getValue("graduation_status") ?? "-"}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const kid = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <DropdownMenuLabel className="text-gray-800 dark:text-gray-200">Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onView(kid)}
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function KidsTable({ requestingUserId, className }) {
  const router = useRouter();
  const [data, setData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const fetchData = React.useCallback(async () => {
    if (!requestingUserId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/manage/kids?requestingUserId=${encodeURIComponent(requestingUserId)}`, {
        headers: { "x-user-id": requestingUserId },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch kids");
      }
      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Error fetching kids:", err);
      toast.error(err.message || "Failed to load kids");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [requestingUserId]);
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = (kid) => {
    router.push(`/management/kids/${kid.id}`);
  };

  const columns = React.useMemo(() => createColumns(handleView), []);
  const fuzzyFilter = React.useCallback((row, columnId, value) => {
    const search = String(value || "").toLowerCase().trim();
    if (!search) return true;
    const text = Object.entries(row.original)
      .map(([k, v]) => (v != null ? String(v).toLowerCase() : ""))
      .join(" ");
    return text.includes(search);
  }, []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, globalFilter, columnVisibility, rowSelection },
  });

  return (
    <div className={`w-full ${className || ""}`}>
      <div className="flex flex-col sm:flex-row items-center gap-3 py-4">
        <Input
          placeholder="Search kids..."
          value={globalFilter ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="max-w-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
        />
      </div>
      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-700">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-white dark:bg-gray-900">
            {isLoading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500 dark:text-gray-400">
                  Loading kids...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500 dark:text-gray-400">
                  No kids found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          {table.getFilteredRowModel().rows.length} kid(s)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
