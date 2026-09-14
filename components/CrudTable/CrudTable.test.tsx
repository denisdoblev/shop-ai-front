import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { CrudTable } from "./CrudTable";
import type { CrudColumn } from "./_types/types";

type Item = { id: string; name: string };

const item = { id: "item-1", name: "Example" };
const columns: CrudColumn<Item>[] = [
  { cell: (row) => row.name, header: "Name", id: "name" },
];

function renderTable(
  createAction?: React.ComponentProps<
    typeof CrudTable<Item>
  >["createAction"],
) {
  return render(
    <TooltipProvider>
      <CrudTable
        columns={columns}
        createAction={createAction}
        deleteDescription={(row) => `Delete ${row.name}`}
        description="Manage examples."
        emptyDescription="Create the first example."
        emptyTitle="No examples"
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        items={[item]}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        title="Examples"
      />
    </TooltipProvider>,
  );
}

describe("CrudTable", () => {
  afterEach(cleanup);

  it("hides the create button when no create action is provided", () => {
    renderTable();

    expect(screen.queryByRole("button", { name: /add/i })).not.toBeInTheDocument();
  });

  it("renders a custom create label and invokes its callback", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    renderTable({ label: "New example", onCreate });

    await user.click(screen.getByRole("button", { name: "New example" }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("uses custom interface messages when provided", () => {
    render(
      <TooltipProvider>
        <CrudTable
          columns={columns}
          deleteDescription={(row) => `Eliminar ${row.name}`}
          description="Administra ejemplos."
          emptyDescription="Crea el primer ejemplo."
          emptyTitle="Sin ejemplos"
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          items={[item]}
          messages={{ actions: "Acciones", edit: "Editar" }}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          title="Ejemplos"
        />
      </TooltipProvider>,
    );

    expect(screen.getByText("Acciones")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Editar Example" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Example" }),
    ).toBeInTheDocument();
  });

  it("renders optional filters without requiring search", () => {
    render(
      <TooltipProvider>
        <CrudTable
          columns={columns}
          deleteDescription={(row) => `Delete ${row.name}`}
          description="Manage examples."
          emptyDescription="Create the first example."
          emptyTitle="No examples"
          filters={<button type="button">Filter examples</button>}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          items={[item]}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          title="Examples"
        />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Filter examples" })).toBeInTheDocument();
  });

  it("renders the no-results copy for active filters without a search", () => {
    render(
      <TooltipProvider>
        <CrudTable
          columns={columns}
          deleteDescription={(row) => `Delete ${row.name}`}
          description="Manage examples."
          emptyDescription="Create the first example."
          emptyTitle="No examples"
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          hasActiveFilters
          items={[]}
          noResultsDescription="Clear the filters."
          noResultsTitle="No filtered examples"
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          title="Examples"
        />
      </TooltipProvider>,
    );

    expect(screen.getByText("No filtered examples")).toBeInTheDocument();
    expect(screen.getByText("Clear the filters.")).toBeInTheDocument();
    expect(screen.queryByText("No examples")).not.toBeInTheDocument();
  });

  it("keeps the empty-state copy when no filters or search are active", () => {
    render(
      <TooltipProvider>
        <CrudTable
          columns={columns}
          deleteDescription={(row) => `Delete ${row.name}`}
          description="Manage examples."
          emptyDescription="Create the first example."
          emptyTitle="No examples"
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          items={[]}
          noResultsTitle="No filtered examples"
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          title="Examples"
        />
      </TooltipProvider>,
    );

    expect(screen.getByText("No examples")).toBeInTheDocument();
    expect(screen.queryByText("No filtered examples")).not.toBeInTheDocument();
  });
});
