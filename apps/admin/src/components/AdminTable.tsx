"use client";
import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type ReactNode,
  type ComponentProps,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Button } from "@heroui/react";
import { FormScope, Input, Select } from "@/components/AdminForms";
function plain(node: ReactNode): string {
  return Children.toArray(node)
    .map((n) =>
      typeof n === "string" || typeof n === "number"
        ? String(n)
        : isValidElement<{ children?: ReactNode }>(n)
          ? plain(n.props.children)
          : "",
    )
    .join(" ")
    .trim();
}
function Table<T>({
  data,
  columns,
  label,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  label: string;
}) {
  const [search, setSearch] = useState(""),
    [sorting, setSorting] = useState<SortingState>([]),
    [filters, setFilters] = useState<ColumnFiltersState>([]);
  // TanStack owns mutable table state; keep this boundary outside compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter: search,
      sorting,
      columnFilters: filters,
      columnVisibility: { search: false },
    },
    onGlobalFilterChange: setSearch,
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: "includesString",
  });
  const status = table.getAllColumns().find((column) => column.id === "status");
  const options = status
    ? Array.from(
        new Set(
          data.map((_, i) =>
            String(table.getCoreRowModel().rows[i]?.getValue("status") ?? ""),
          ),
        ),
      )
        .filter(Boolean)
        .sort()
    : [];
  return (
    <section aria-label={label} className="min-w-0 space-y-3">
      <FormScope>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            type="search"
            label={`Search ${label}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          />
          {!!options.length && (
            <Select
              label="Filter status"
              value={String(status?.getFilterValue() ?? "")}
              onChange={(e) =>
                status?.setFilterValue(e.target.value || undefined)
              }
            >
              <option value="">All statuses</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          )}
          <Select
            label="Rows per page"
            value={String(table.getState().pagination.pageSize)}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
      </FormScope>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{label}</caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="border-b border-border p-3"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    {header.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => header.column.toggleSorting()}
                        aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc"
                          ? " ↑"
                          : header.column.getIsSorted() === "desc"
                            ? " ↓"
                            : ""}
                      </Button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-border p-3 align-top"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!table.getRowModel().rows.length && (
        <p role="status" className="text-sm text-muted">
          No matching records.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm text-muted">
          {table.getFilteredRowModel().rows.length} records · Page{" "}
          {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(1, table.getPageCount())}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            isDisabled={!table.getCanPreviousPage()}
            onPress={() => table.previousPage()}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isDisabled={!table.getCanNextPage()}
            onPress={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
/** Keeps operational row actions and editors while giving every record list table controls. */
export function DataList<T>({
  data,
  renderItem,
  label = "records",
}: {
  data: readonly T[] | undefined | null;
  renderItem: (item: T, index: number) => ReactNode;
  label?: string;
}) {
  const rows = useMemo(() => Array.from(data ?? []), [data]);
  const extraFields = useMemo(
    () =>
      [
        ["email", "Email"],
        ["type", "Type"],
        ["area", "Area"],
        ["address", "Address"],
        ["priceCents", "Price (€)"],
        ["amountCents", "Amount (€)"],
        ["totalCents", "Total (€)"],
        ["capacityUnits", "Capacity"],
        ["maxOrders", "Order limit"],
        ["grams", "Grams"],
        ["receipts", "Receipts"],
        ["createdAt", "Created"],
        ["dueAt", "Due"],
        ["startsAt", "Starts"],
      ]
        .filter(([key]) =>
          rows.some((row) => {
            const value = (row as Record<string, unknown>)[key!];
            return typeof value === "string" || typeof value === "number";
          }),
        )
        .slice(0, 3),
    [rows],
  );
  const hasStatus = rows.some((row) => {
    const r = row as Record<string, unknown>;
    return (
      r.status ||
      r.state ||
      typeof r.isActive === "boolean" ||
      typeof r.published === "boolean" ||
      "session" in r
    );
  });
  const columns = useMemo<ColumnDef<T>[]>(
    () => [
      {
        id: "record",
        header: "Record",
        accessorFn: (item) => {
          const r = item as Record<string, unknown>;
          return String(
            r.name ||
              r.title ||
              r.code ||
              r.email ||
              (r.firstName
                ? `${r.firstName} ${r.lastName || ""}`.trim()
                : "") ||
              r.orderNumber ||
              (r.version ? `Version ${r.version}` : "") ||
              r.action ||
              r.event ||
              r.type ||
              (r.userId || r.orderId || r.id || r._id
                ? `#${String(r.userId || r.orderId || r.id || r._id).slice(-8)}`
                : "") ||
              "Record",
          );
        },
        cell: (info) => String(info.getValue()),
      },
      ...(hasStatus
        ? ([
            {
              id: "status",
              header: "Status",
              filterFn: "equalsString",
              accessorFn: (item) => {
                const r = item as Record<string, unknown>;
                return String(
                  r.status ||
                    r.state ||
                    (typeof r.published === "boolean"
                      ? r.published
                        ? "Published"
                        : "Draft"
                      : "") ||
                    ("session" in r
                      ? r.session
                        ? "On duty"
                        : "Off duty"
                      : "") ||
                    (typeof r.isActive === "boolean"
                      ? r.isActive
                        ? "Active"
                        : "Inactive"
                      : ""),
                );
              },
            },
          ] as ColumnDef<T>[])
        : []),
      ...extraFields.map(([key, header]): ColumnDef<T> => ({
        id: key!,
        header,
        accessorFn: (item) => (item as Record<string, unknown>)[key!],
        cell: (info) => {
          const value = info.getValue();
          if (value === undefined || value === null) return "—";
          if (key!.endsWith("Cents")) return (Number(value) / 100).toFixed(2);
          if (key!.endsWith("At"))
            return new Date(String(value)).toLocaleString();
          return String(value);
        },
      })),
      {
        id: "search",
        accessorFn: (item) =>
          [
            JSON.stringify(item),
            ...extraFields.map(([key]) => {
              const value = (item as Record<string, unknown>)[key!];
              return key!.endsWith("Cents")
                ? (Number(value) / 100).toFixed(2)
                : key!.endsWith("At") && value
                  ? new Date(String(value)).toLocaleString()
                  : String(value ?? "");
            }),
          ].join(" "),
        enableHiding: true,
      },
      {
        id: "details",
        header: "Details and actions",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: (info) => {
          const content = renderItem(info.row.original, info.row.index);
          return isValidElement<{ children?: ReactNode }>(content) &&
            content.type === "li" ? (
            <div>{content.props.children}</div>
          ) : (
            content
          );
        },
      },
    ],
    [renderItem, extraFields, hasStatus],
  );
  return <Table data={rows} columns={columns} label={label} />;
}
/** Migrates an existing semantic table without dropping its actions or formatted cells. */
export function AdminTable({
  children,
  "aria-label": label,
  ...props
}: ComponentProps<"table">) {
  const { headers, data } = useMemo(() => {
    const sections = Children.toArray(children).filter(
      isValidElement<{ children?: ReactNode }>,
    );
    const head = sections.find((section) => section.type === "thead");
    const body = sections.find((section) => section.type === "tbody");
    const headers = Children.toArray(
      (
        Children.toArray(head?.props.children)[0] as
          React.ReactElement<{ children?: ReactNode }> | undefined
      )?.props.children,
    );
    const data = Children.toArray(body?.props.children)
      .filter(isValidElement<{ children?: ReactNode }>)
      .map((row) =>
        Children.toArray(row.props.children)
          .filter(isValidElement<{ children?: ReactNode }>)
          .map((cell) => cell.props.children),
      );
    return { headers, data };
  }, [children]);
  const columns = useMemo<ColumnDef<ReactNode[]>[]>(
    () =>
      headers.map((h, i) => ({
        id: plain(h).toLowerCase().includes("status")
          ? "status"
          : `column_${i}`,
        filterFn: "equalsString",
        header: plain(h) || `Column ${i + 1}`,
        accessorFn: (row) => plain(row[i]),
        cell: (info) => info.row.original[i],
      })),
    [headers],
  );
  return (
    <div className={props.className}>
      <Table data={data} columns={columns} label={label || "records"} />
    </div>
  );
}
