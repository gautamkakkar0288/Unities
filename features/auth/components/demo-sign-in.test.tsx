import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DemoSignIn } from "./demo-sign-in"
import type { DemoAccount } from "@/lib/demo/accounts"

const signInAsDemoAccount = vi.fn()

vi.mock("@/features/auth/demo-actions", () => ({
  signInAsDemoAccount: (email: string) => signInAsDemoAccount(email),
}))

const ACCOUNTS: DemoAccount[] = [
  {
    email: "gautam1153.becse24@chitkara.edu.in",
    label: "Continue as Demo Student",
    description: "Onboarded, with upcoming events.",
    role: "STUDENT",
  },
  {
    email: "admin.cirqles@chitkara.edu.in",
    label: "Continue as Demo Admin",
    description: "Verification queue and audit log.",
    role: "PLATFORM_ADMIN",
  },
]

describe("DemoSignIn", () => {
  beforeEach(() => {
    signInAsDemoAccount.mockReset()
    signInAsDemoAccount.mockResolvedValue({ ok: true, data: undefined })
  })

  it("offers one button per demo account", () => {
    render(<DemoSignIn accounts={ACCOUNTS} password="demo1234" />)

    expect(
      screen.getByRole("button", { name: "Continue as Demo Student" }),
    ).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Continue as Demo Admin" }),
    ).toBeTruthy()
  })

  it("sends the account's email, never a role", async () => {
    /**
     * The load-bearing assertion. If this component ever sends a role, the
     * client is choosing its own privileges; the role must come from the user
     * row that the email resolves to.
     */
    render(<DemoSignIn accounts={ACCOUNTS} password="demo1234" />)

    screen.getByRole("button", { name: "Continue as Demo Admin" }).click()

    await vi.waitFor(() =>
      expect(signInAsDemoAccount).toHaveBeenCalledWith(
        "admin.cirqles@chitkara.edu.in",
      ),
    )
    expect(signInAsDemoAccount).toHaveBeenCalledTimes(1)
  })

  it("shows the password, so a presenter can use the normal form too", () => {
    render(<DemoSignIn accounts={ACCOUNTS} password="demo1234" />)

    expect(screen.getByText("demo1234")).toBeTruthy()
  })

  it("says the identities are fictional", () => {
    render(<DemoSignIn accounts={ACCOUNTS} password="demo1234" />)

    expect(screen.getByText(/fictional/i)).toBeTruthy()
  })

  it("reports a failure instead of leaving the button spinning", async () => {
    signInAsDemoAccount.mockResolvedValue({
      ok: false,
      code: "INVALID",
      message: "The demo accounts are missing. Run `npm run db:reset`.",
    })

    render(<DemoSignIn accounts={ACCOUNTS} password="demo1234" />)
    screen.getByRole("button", { name: "Continue as Demo Student" }).click()

    expect(
      await screen.findByText(/demo accounts are missing/i),
    ).toBeTruthy()
    // The label returns, so the button can be tried again.
    expect(
      screen.getByRole("button", { name: "Continue as Demo Student" }),
    ).toBeTruthy()
  })

  it("renders nothing when demo sign-in is off", () => {
    /**
     * The page decides. An empty list has to produce no divider and no
     * explanatory text, or a real deployment would show the scaffolding of a
     * feature it does not have.
     */
    const { container } = render(
      <DemoSignIn accounts={[]} password="demo1234" />,
    )

    expect(container.textContent).toBe("")
  })
})
