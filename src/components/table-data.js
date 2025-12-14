"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, User, Mail, GraduationCap, Users, CheckCircle, XCircle, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const data = [
  {
    id: "1",
    fullName: "Savio Dominic",
    email: "savio@example.com",
    grade: "Grade 12",
    status: "active",
    family: "Nyang'oro",
    joinDate: "2023-01-15"
  },
  {
    id: "2",
    fullName: "Abe Johnson",
    email: "abe45@example.com",
    grade: "Grade 11",
    status: "inactive",
    family: "Kamere",
    joinDate: "2022-09-10"
  },
  {
    id: "3",
    fullName: "Monica Serrat",
    email: "monserrat44@example.com",
    grade: "Grade 10",
    status: "active",
    family: "Simba",
    joinDate: "2023-03-22"
  },
  {
    id: "4",
    fullName: "Silas Brown",
    email: "silas22@example.com",
    grade: "Grade 12",
    status: "pending",
    family: "Twiga",
    joinDate: "2023-05-18"
  },
  {
    id: "5",
    fullName: "Carmella Jones",
    email: "carmella@example.com",
    grade: "Grade 9",
    status: "active",
    family: "Chui",
    joinDate: "2022-11-30"
  },
  {
    id: "6",
    fullName: "Ken Tanaka",
    email: "ken99@example.com",
    grade: "Alumni",
    status: "alumni",
    family: "Tembo",
    joinDate: "2021-08-05"
  },
  {
    id: "7",
    fullName: "Sarah Chen",
    email: "sarah.chen@example.com",
    grade: "Grade 11",
    status: "active",
    family: "Kifaru",
    joinDate: "2023-02-14"
  },
  {
    id: "8",
    fullName: "David Omondi",
    email: "david.om@example.com",
    grade: "Grade 10",
    status: "inactive",
    family: "Ndovu",
    joinDate: "2022-12-01"
  }
]

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-600"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-600"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <User className="mr-2 h-4 w-4" />
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium text-gray-800 dark:text-gray-200">
        {row.getValue("fullName")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Mail className="mr-2 h-4 w-4" />
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-gray-700 dark:text-gray-300">
        {row.getValue("email")}
      </div>
    ),
  },
  {
    accessorKey: "grade",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Grade
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-gray-700 dark:text-gray-300">
        {row.getValue("grade")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status")
      return (
        <div className="flex items-center">
          {status === "active" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <CheckCircle className="h-3 w-3" />
              Active
            </div>
          )}
          {status === "inactive" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              <XCircle className="h-3 w-3" />
              Inactive
            </div>
          )}
          {status === "pending" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
              <Clock className="h-3 w-3" />
              Pending
            </div>
          )}
          {status === "alumni" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
              <GraduationCap className="h-3 w-3" />
              Alumni
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "family",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Users className="mr-2 h-4 w-4" />
          Family
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-gray-700 dark:text-gray-300">
        {row.getValue("family")}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const student = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          >
            <DropdownMenuLabel className="text-gray-800 dark:text-gray-200">Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(student.email)}
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              Copy email
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(student.id)}
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              Copy student ID
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              View profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              Edit details
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
              Remove student
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function DataTableDemo({ className }) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-3 py-4">
        <Input
          placeholder="Search students..."
          value={(table.getColumn("fullName")?.getFilterValue()) ?? ""}
          onChange={(event) =>
            table.getColumn("fullName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-500 dark:focus:ring-green-400"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="ml-0 sm:ml-auto bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          >
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-700">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead 
                          key={header.id} 
                          className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap"
                        >
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
              <TableBody className="bg-white dark:bg-gray-900">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
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
                      className="h-24 text-center text-gray-500 dark:text-gray-400"
                    >
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} student(s) selected.
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}