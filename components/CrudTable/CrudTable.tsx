"use client";

import { AlertCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { CrudTableProps } from "./types/types";

export function CrudTable<TItem>({
  columns,
  createAction,
  deleteDescription,
  description,
  emptyDescription,
  emptyTitle,
  eyebrow,
  getRowId,
  getRowLabel,
  items,
  noResultsDescription = "Try changing or clearing your search.",
  noResultsTitle = "No matching results",
  onDelete,
  onEdit,
  pagination,
  search,
  title,
}: CrudTableProps<TItem>) {
  const [deleteTarget, setDeleteTarget] = useState<TItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const isEmptyResult =
    Boolean(search?.value.trim()) || (pagination?.page ?? 1) > 1;

  function handleDelete() {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await onDelete(target);
      setDeleteTarget(null);

      if (!result.success) setDeleteError(result.message);
    });
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <p className="font-label text-xs font-bold tracking-[0.12em] text-primary uppercase">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>

        {createAction ? (
          <Button type="button" size="lg" onClick={createAction.onCreate}>
            <Plus data-icon="inline-start" />
            {createAction.label}
          </Button>
        ) : null}
      </header>

      <div className="flex flex-col gap-6">
        {search ? (
          <InputGroup className="h-10 max-w-md bg-card">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={search.placeholder}
              maxLength={search.maxLength}
              onChange={(event) => search.onValueChange(event.target.value)}
              placeholder={search.placeholder}
              value={search.value}
            />
          </InputGroup>
        ) : null}

        {deleteError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not delete the item</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        ) : null}

        <div
          aria-busy={search?.isPending || pagination?.isPending}
          className="overflow-hidden rounded-xl border bg-card shadow-xs"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {columns.map((column) => (
                  <TableHead key={column.id} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item) => {
                  const rowLabel = getRowLabel(item);

                  return (
                    <TableRow key={getRowId(item)}>
                      {columns.map((column) => (
                        <TableCell key={column.id} className={column.className}>
                          {column.cell(item)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  aria-label={`Edit ${rowLabel}`}
                                  className="border-primary/25 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/15 hover:shadow-sm"
                                  onClick={() => onEdit(item)}
                                />
                              }
                            >
                              <Pencil />
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  aria-label={`Delete ${rowLabel}`}
                                  onClick={() => setDeleteTarget(item)}
                                />
                              }
                            >
                              <Trash2 />
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="p-0">
                    <Empty className="min-h-56 border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Search />
                        </EmptyMedia>
                        <EmptyTitle>
                          {isEmptyResult ? noResultsTitle : emptyTitle}
                        </EmptyTitle>
                        <EmptyDescription>
                          {isEmptyResult
                            ? noResultsDescription
                            : emptyDescription}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    text="Previous"
                    aria-disabled={
                      !pagination.hasPrevious || pagination.isPending
                    }
                    tabIndex={pagination.hasPrevious ? undefined : -1}
                    className={cn(
                      (!pagination.hasPrevious || pagination.isPending) &&
                        "pointer-events-none opacity-50",
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.hasPrevious && !pagination.isPending) {
                        pagination.onPrevious();
                      }
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    text="Next"
                    aria-disabled={!pagination.hasNext || pagination.isPending}
                    tabIndex={pagination.hasNext ? undefined : -1}
                    className={cn(
                      (!pagination.hasNext || pagination.isPending) &&
                        "pointer-events-none opacity-50",
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.hasNext && !pagination.isPending) {
                        pagination.onNext();
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? deleteDescription(deleteTarget) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
