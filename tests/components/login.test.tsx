import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/pages/LoginPage";
import { AppProvider } from "@/components/layout/AppProvider";

function renderLogin() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <LoginPage />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("renders login form", () => {
    renderLogin();
    expect(screen.getByRole("heading", { name: /coinzy admin/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/admin api key/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows validation when submitting empty key", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText(/admin api key is required/i)).toBeInTheDocument();
  });
});
