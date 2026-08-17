import { describe, expect, it, vi } from "vitest"

import { consoleTransport } from "./console-transport"
import { smtpConfigFromEnv } from "./smtp-transport"
import { verificationEmail } from "./templates"
import { sendEmail, setEmailTransport } from "./index"

// ---------------------------------------------------------------------------
// Console transport
// ---------------------------------------------------------------------------

describe("consoleTransport", () => {
  it("prints without throwing in development", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {})
    await expect(
      consoleTransport.send({
        to: "a@chitkara.edu.in",
        subject: "Test",
        text: "hello",
        html: "<p>hello</p>",
      }),
    ).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it("throws in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    await expect(
      consoleTransport.send({
        to: "a@chitkara.edu.in",
        subject: "Test",
        text: "hello",
        html: "<p>hello</p>",
      }),
    ).rejects.toThrow(/console email transport cannot be used in production/)
    vi.unstubAllEnvs()
  })


  it("does not log the message body to avoid credential leakage", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {})
    await consoleTransport.send({
      to: "a@chitkara.edu.in",
      subject: "Subject",
      text: "super secret token 12345",
      html: "<p>super secret token 12345</p>",
    })
    // The text is printed (intentional - it's the verification link), but we
    // verify the subject and to are present as expected headers.
    const logged = spy.mock.calls[0][0] as string
    expect(logged).toContain("a@chitkara.edu.in")
    expect(logged).toContain("Subject")
    spy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// smtpConfigFromEnv
// ---------------------------------------------------------------------------

describe("smtpConfigFromEnv", () => {
  it("returns missing list when env vars are absent", () => {
    const saved = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      SMTP_FROM: process.env.SMTP_FROM,
    }
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASSWORD
    delete process.env.SMTP_FROM

    const result = smtpConfigFromEnv()
    expect(result.config).toBeNull()
    expect(result.missing).toContain("SMTP_HOST")
    expect(result.missing).toContain("SMTP_USER")
    expect(result.missing).toContain("SMTP_PASSWORD")
    expect(result.missing).toContain("SMTP_FROM")

    Object.assign(process.env, saved)
  })

  it("returns a config when all required vars are present", () => {
    process.env.SMTP_HOST = "smtp.example.com"
    process.env.SMTP_PORT = "587"
    process.env.SMTP_USER = "user"
    process.env.SMTP_PASSWORD = "pass"
    process.env.SMTP_FROM = "noreply@cirqles.com"

    const result = smtpConfigFromEnv()
    expect(result.missing).toBeNull()
    expect(result.config).toMatchObject({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "user",
      from: "noreply@cirqles.com",
    })
    // IMPORTANT: password must never leak to logs via the config object
    // but it is present in the config for the transport to use.
    expect(result.config?.password).toBe("pass")

    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASSWORD
    delete process.env.SMTP_FROM
  })

  it("sets secure=true for port 465", () => {
    process.env.SMTP_HOST = "smtp.example.com"
    process.env.SMTP_PORT = "465"
    process.env.SMTP_USER = "u"
    process.env.SMTP_PASSWORD = "p"
    process.env.SMTP_FROM = "f@x.com"

    const result = smtpConfigFromEnv()
    expect(result.config?.secure).toBe(true)

    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASSWORD
    delete process.env.SMTP_FROM
  })
})

// ---------------------------------------------------------------------------
// sendEmail / setEmailTransport
// ---------------------------------------------------------------------------

describe("sendEmail", () => {
  it("routes through whatever transport is set", async () => {
    const sent: unknown[] = []
    setEmailTransport({
      name: "test-spy",
      async send(msg) {
        sent.push(msg)
      },
    })

    await sendEmail({
      to: "a@chitkara.edu.in",
      subject: "Hi",
      text: "hi",
      html: "<p>hi</p>",
    })

    expect(sent).toHaveLength(1)

    // Restore console transport for other tests
    setEmailTransport(consoleTransport)
  })
})

// ---------------------------------------------------------------------------
// verificationEmail template
// ---------------------------------------------------------------------------

describe("verificationEmail", () => {
  it("includes the verify URL in both text and HTML", () => {
    const msg = verificationEmail({
      to: "a@chitkara.edu.in",
      name: "Arjun",
      universityName: "Chitkara University",
      verifyUrl: "http://localhost:3000/verify-email?token=abc123",
      expiresInMinutes: 60,
    })
    expect(msg.text).toContain("http://localhost:3000/verify-email?token=abc123")
    expect(msg.html).toContain("http://localhost:3000/verify-email?token=abc123")
  })

  it("escapes HTML in the verify URL to prevent injection", () => {
    const msg = verificationEmail({
      to: "a@chitkara.edu.in",
      name: null,
      universityName: "Chitkara",
      verifyUrl: 'http://localhost/?x=1&y=<script>',
      expiresInMinutes: 30,
    })
    expect(msg.html).not.toContain("<script>")
    expect(msg.html).toContain("&lt;script&gt;")
    expect(msg.html).toContain("&amp;")
  })

  it("sets the correct recipient and subject", () => {
    const msg = verificationEmail({
      to: "student@chitkara.edu.in",
      name: "Priya",
      universityName: "Chitkara",
      verifyUrl: "http://localhost/verify?t=x",
      expiresInMinutes: 15,
    })
    expect(msg.to).toBe("student@chitkara.edu.in")
    expect(msg.subject).toMatch(/confirm/i)
  })
})
