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
import { ArrowUpDown, ChevronDown, MoreHorizontal, User, Mail, ArrowLeft, Users, CheckCircle,Eye, XCircle,View, Clock, Plus, Edit, Trash2, Shield, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {motion} from "framer-motion"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Helper function to format column names
const formatColumnName = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to get column icon
const getColumnIcon = (key) => {
  const icons = {
    email: Mail,
    first_name: User,
    rwandan_name: User,
    username: User,
    // is_student: GraduationCap,
    // is_alumni: GraduationCap,
    // is_crc: Users,
    // is_superuser: ShieldCheck,
    phone: Users,
  }
  return icons[key] || User
}

// Create dynamic columns based on data
const createColumns = (onEdit, onDelete, onViewDetails) => {
  const baseColumns = [
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
  ]

  // Dynamically create columns for all fields except id and password
  const fieldColumns = [
    {
      accessorKey: "first_name",
      header: ({ column }) => {
        const Icon = getColumnIcon("first_name")
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Icon className="mr-2 h-4 w-4" />
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium text-gray-800 dark:text-gray-200">
          {row.getValue("first_name") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "rwandan_name",
      header: ({ column }) => {
        const Icon = getColumnIcon("rwandan_name")
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Icon className="mr-2 h-4 w-4" />
            Rwandan Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300">
          {row.getValue("rwandan_name") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        const Icon = getColumnIcon("email")
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Icon className="mr-2 h-4 w-4" />
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
      accessorKey: "username",
      header: ({ column }) => {
        const Icon = getColumnIcon("username")
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Icon className="mr-2 h-4 w-4" />
            Username
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300">
          {row.getValue("username") || "-"}
        </div>
      ),
    },
    // {
    //   accessorKey: "is_student",
    //   header: ({ column }) => {
    //     const Icon = getColumnIcon("is_student")
    //     return (
    //       <Button
    //         variant="ghost"
    //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //         className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    //       >
    //         <Icon className="mr-2 h-4 w-4" />
    //         Is Student
    //         <ArrowUpDown className="ml-2 h-4 w-4" />
    //       </Button>
    //     )
    //   },
    //   cell: ({ row }) => {
    //     const value = row.getValue("is_student")
    //     return (
    //       <div className="flex items-center">
    //         {value ? (
    //           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
    //             <CheckCircle className="h-3 w-3" />
    //             Yes
    //           </div>
    //         ) : (
    //           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400">
    //             <XCircle className="h-3 w-3" />
    //             No
    //           </div>
    //         )}
    //       </div>
    //     )
    //   },
    // },
    // {
    //   accessorKey: "is_alumni",
    //   header: ({ column }) => {
    //     const Icon = getColumnIcon("is_alumni")
    //     return (
    //       <Button
    //         variant="ghost"
    //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //         className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    //       >
    //         <Icon className="mr-2 h-4 w-4" />
    //         Is Alumni
    //         <ArrowUpDown className="ml-2 h-4 w-4" />
    //       </Button>
    //     )
    //   },
    //   cell: ({ row }) => {
    //     const value = row.getValue("is_alumni")
    //     return (
    //       <div className="flex items-center">
    //         {value ? (
    //           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
    //             <GraduationCap className="h-3 w-3" />
    //             Yes
    //           </div>
    //         ) : (
    //           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400">
    //             <XCircle className="h-3 w-3" />
    //             No
    //           </div>
    //         )}
    //       </div>
    //     )
    //   },
    // },
    // {
    //   accessorKey: "is_crc",
    //   header: ({ column }) => {
    //     const Icon = getColumnIcon("is_crc")
    //     return (
    //       <Button
    //         variant="ghost"
    //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //         className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    //       >
    //         <Icon className="mr-2 h-4 w-4" />
    //         Is CRC
    //         <ArrowUpDown className="ml-2 h-4 w-4" />
    //       </Button>
    //     )
    //   },
    //   cell: ({ row }) => {
    //     const value = row.getValue("is_crc")
    //     return (
    //       <div className="flex items-center">
    //         {value ? (
    //           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
    //             <Shield className="h-3 w-3" />
    //             Yes
    //           </div>
    //         ) : (
    //           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400">
    //             <XCircle className="h-3 w-3" />
    //             No
    //           </div>
    //         )}
    //       </div>
    //     )
    //   },
    // },
    // {
    //   accessorKey: "is_superuser",
    //   header: ({ column }) => {
    //     const Icon = getColumnIcon("is_superuser")
    //     return (
    //       <Button
    //         variant="ghost"
    //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //         className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    //       >
    //         <Icon className="mr-2 h-4 w-4" />
    //         Is Superuser
    //         <ArrowUpDown className="ml-2 h-4 w-4" />
    //       </Button>
    //     )
    //   },
    //   cell: ({ row }) => {
    //     const value = row.getValue("is_superuser")
    //     return (
    //       <div className="flex items-center">
    //         {value ? (
    //           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
    //             <ShieldCheck className="h-3 w-3" />
    //             Yes
    //           </div>
    //         ) : (
    //           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400">
    //             <XCircle className="h-3 w-3" />
    //             No
    //           </div>
    //         )}
    //       </div>
    //     )
    //   },
    // },
    {
      accessorKey: "phone",
      header: ({ column }) => {
        const Icon = getColumnIcon("phone")
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Icon className="mr-2 h-4 w-4" />
            Phone
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300">
          {row.getValue("phone") || "-"}        </div>
      ),
    },
    // {
    //   accessorKey: "is_staff",
    //   header: ({ column }) => {
    //     const Icon = getColumnIcon("is_staff")
    //     return (
    //       <Button
    //         variant="ghost"
    //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //         className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    //       >
    //         <Icon className="mr-2 h-4 w-4" />
    //         Is Staff
    //         <ArrowUpDown className="ml-2 h-4 w-4" />
    //       </Button>
    //     )
    //   },
    //   cell: ({ row }) => (
    //     <div className="text-gray-700 dark:text-gray-300">
    //       {row.getValue("is_staff") || "-"}        </div>
    //   ),
    // },
       {
      accessorKey: "gender",
      header: ({ column }) => {
        const Icon = getColumnIcon("gender")
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Icon className="mr-2 h-4 w-4" />
            Gender
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300">
          {row.getValue("gender") || "-"}        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original

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
                onClick={() => navigator.clipboard.writeText(user.email)}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              <DropdownMenuItem 
                onClick={() => onEdit(user)}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit user
              </DropdownMenuItem>
               <DropdownMenuItem 
                onClick={() => onViewDetails(user)}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              <DropdownMenuItem 
                onClick={() => onDelete(user)}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
 
  ]

  return [...baseColumns, ...fieldColumns]
}

export function DataTableDemo({ className }) {
  const router = useRouter();
  const [data, setData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [formData, setFormData] = React.useState({
    first_name: "",
    rwandan_name: "",
    email: "",
    username: "",
    password: "",
    is_student: false,
    is_alumni: false,
    is_crc: false,
    is_superuser: false,
    phone: "",
    gender: "",
    is_staff: false,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/manage');
      if (!response.ok) throw new Error('Failed to fetch data');
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setFormData({
      first_name: "",
      rwandan_name: "",
      email: "",
      username: "",
      password: "",
      is_student: false,
      is_alumni: false,
      is_crc: false,
      is_superuser: false,
      phone: "",
      is_staff: false,
      gender: "",
    });
    setSelectedUser(null);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || "",
      rwandan_name: user.rwandan_name || "",
      email: user.email || "",
      username: user.username || "",
      password: "", // Don't prefill password
      is_student: user.is_student || false,
      is_alumni: user.is_alumni || false,
      is_crc: user.is_crc || false,
      is_superuser: user.is_superuser || false,
      phone: user.phone || "",
      is_staff: user.is_staff || false,
      gender: user.gender || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (user) => {
    router.push(`/management/user/${user.id}`);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if(!formData.first_name || !formData.email || !formData.password || !formData.gender) {
      toast.error('Please fill in all required fields');
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      if (formData.is_student && result.user?.id) {
        sessionStorage.setItem(
          'asyv_pending_student_setup',
          JSON.stringify({
            userId: result.user.id,
            first_name: result.user.first_name,
            rwandan_name: result.user.rwandan_name,
            email: result.user.email,
          })
        );
        toast.success('User created. Complete the student profile next.');
        setIsCreateDialogOpen(false);
        fetchData();
        router.push('/management/advanced');
        return;
      }

      toast.success('User created successfully!');
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if(!formData.first_name || !formData.email || !formData.gender) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    try {
      // Don't send password if it's empty
      const updateData = { ...formData, id: selectedUser.id };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const response = await fetch('/api/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }
      toast.success('User updated successfully!');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/manage?id=${selectedUser.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      toast.success('User deleted successfully!');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = React.useMemo(() => createColumns(handleEdit, handleDelete, handleViewDetails), []);

  // Custom global filter function that searches across all columns
  const fuzzyFilter = React.useCallback((row, columnId, value) => {
    const search = String(value || '').toLowerCase().trim();
    
    if (!search) return true;
    
    // Get all cell values in the row and make them searchable
    const searchableText = Object.entries(row.original)
      .map(([key, value]) => {
        let text = '';
        
        // Handle boolean values - make them searchable with multiple keywords
        if (typeof value === 'boolean') {
          text = value ? 'yes true 1' : 'no false 0';
        }
        // Handle null/undefined
        else if (value === null || value === undefined) {
          text = '';
        }
        // Convert to string for searching
        else {
          text = String(value).toLowerCase();
        }
        
        return text;
      })
      .join(' ');

    return searchableText.includes(search);
  }, []);

  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [rowSelection, setRowSelection] = React.useState({})

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
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
  })
  const MotionLink=motion(Link);

  return (
    <div className={`w-full ${className}`}>
         <MotionLink
              href="/dashboard"
              whileHover={{scale:1.05}}
              whileTap={{scale:0.95}}
               className=" top-20 left-8 z-50 inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 dark:bg-gray-800 rounded-lg transition-colors"
              >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </MotionLink>
      <div className="flex flex-col sm:flex-row items-center gap-3 py-4">
        <Input
          placeholder="Search by name, email, phone, is_crc, is_superuser, etc..."
          value={globalFilter ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="max-w-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-500 dark:focus:ring-green-400"
        />
        <Button
          onClick={handleCreate}
          className="ml-0 sm:ml-auto bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                {isLoading && data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-500 dark:text-gray-400"
                    >
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
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
                      No users found.
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
          {table.getFilteredRowModel().rows.length} user(s) selected.
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

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Create New User</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Fill in the details to create a new user account.
              {formData.is_student && (
                <span className="block mt-2 text-amber-700 dark:text-amber-400">
                  With &quot;Is Student&quot; enabled, saving creates the account first, then opens the student (kid) form to finish setup.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-gray-700 dark:text-gray-300">First Name *</Label>
                  <Input
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rwandan_name" className="text-gray-700 dark:text-gray-300">Rwandan Name</Label>
                  <Input
                    id="rwandan_name"
                    value={formData.rwandan_name}
                    onChange={(e) => setFormData({ ...formData, rwandan_name: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
              
                {/* <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                    required
                  />
                </div> */}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
                  <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="is_student" className="text-gray-700 dark:text-gray-300">Is Student</Label>
                  <Select
                    value={formData.is_student ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_student: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="is_alumni" className="text-gray-700 dark:text-gray-300">Is Alumni</Label>
                  <Select
                    value={formData.is_alumni ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_alumni: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="is_crc" className="text-gray-700 dark:text-gray-300">Is CRC</Label>
                  <Select
                    value={formData.is_crc ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_crc: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_superuser" className="text-gray-700 dark:text-gray-300">Is Superuser</Label>
                  <Select
                    value={formData.is_superuser ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_superuser: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_staff" className="text-gray-700 dark:text-gray-300">Is Staff</Label>
                  <Select
                    value={formData.is_staff ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_staff: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-700 dark:text-gray-300">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isLoading}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Creating..." : formData.is_student ? "Create User & Continue" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Edit User</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update user information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name" className="text-gray-700 dark:text-gray-300">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_rwandan_name" className="text-gray-700 dark:text-gray-300">Rwandan Name</Label>
                  <Input
                    id="edit_rwandan_name"
                    value={formData.rwandan_name}
                    onChange={(e) => setFormData({ ...formData, rwandan_name: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_email" className="text-gray-700 dark:text-gray-300">Email *</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_username" className="text-gray-700 dark:text-gray-300">Username</Label>
                  <Input
                    id="edit_username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_password" className="text-gray-700 dark:text-gray-300">New Password (optional)</Label>
                  <Input
                    id="edit_password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_phone" className="text-gray-700 dark:text-gray-300">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_is_student" className="text-gray-700 dark:text-gray-300">Is Student</Label>
                  <Select
                    value={formData.is_student ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_student: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_is_alumni" className="text-gray-700 dark:text-gray-300">Is Alumni</Label>
                  <Select
                    value={formData.is_alumni ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_alumni: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_is_crc" className="text-gray-700 dark:text-gray-300">Is CRC</Label>
                  <Select
                    value={formData.is_crc ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_crc: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_is_superuser" className="text-gray-700 dark:text-gray-300">Is Superuser</Label>
                  <Select
                    value={formData.is_superuser ? "true" : "false"}
                    onValueChange={(value) => setFormData({ ...formData, is_superuser: value === "true" })}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isLoading}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Delete User</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



