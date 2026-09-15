import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeContent, assistantUrl } from "./HomeContent";

afterEach(cleanup);

describe("HomeContent", () => {
  it("presenta el hero en español con búsqueda obligatoria", () => {
    render(<HomeContent><p>Contenido del catálogo</p></HomeContent>);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Elegí mejor");
    const search = screen.getByRole("textbox", { name: "¿Qué producto estás buscando?" });
    expect(search).toBeRequired();
    expect(search).toHaveAttribute("name", "q");
    expect(search.closest("form")).toHaveAttribute("action", "/assistant");
    expect(screen.getByText("Contenido del catálogo")).toBeInTheDocument();
    expect(assistantUrl("audio y video")).toBe("/assistant?q=audio+y+video");
  });

});
