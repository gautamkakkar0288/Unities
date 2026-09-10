import { readJsonObject } from "@/lib/api/mobile/body"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import {
  mobileData,
  mobileError,
  mobileValidationError,
} from "@/lib/api/mobile/response"
import { signUpSchema } from "@/lib/schemas/auth"
import { registerUser } from "@/features/auth/actions"
import { findUniversityForEmail } from "@/lib/services/verification"

/**
 * POST /api/mobile/auth/sign-up - create an account from a phone.
 *
 * The only unauthenticated route in the mobile API, for the obvious reason.
 *
 * `registerUser` stays the single implementation of what signing up means: the
 * same `signUpSchema`, the same lowercasing, the same university-domain gate,
 * the same duplicate check, the same bcrypt cost, the same `STUDENT` default,
 * the same unverified email, and the same verification mail sent through
 * `requestEmailVerification`. This route calls it and does not restate a word of
 * it.
 *
 * What this route adds is a machine-readable reason. The server action returns
 * one human sentence for every refusal, which is right for a form and useless to
 * a client that has to decide between highlighting a password field, sending the
 * student to sign-in, and explaining that their address is not a campus one. So
 * the schema and the university lookup are consulted *first*, to classify - not
 * to enforce. `registerUser` re-checks both, and remains the thing that actually
 * decides. Anything it still refuses after those two pass is a duplicate
 * account, which is a 409.
 *
 * The response is deliberately three flags rather than a session. This endpoint
 * does not sign anybody in: minting a session would mean a second
 * authentication path, and Auth.js already owns that. The client posts the
 * credentials to the existing `/api/auth/callback/credentials` afterwards.
 *
 * Not implemented here, and a real gap rather than an oversight: nothing rate
 * limits this route, so it can be used to test whether an address is registered.
 * The web form has the same exposure today; fixing it belongs in one place for
 * both.
 */
export const POST = withMobileRoute(
  "POST /api/mobile/auth/sign-up",
  async (request: Request) => {
    const body = await readJsonObject(request)
    if (!body.ok) return body.response

    const parsed = signUpSchema.safeParse(body.value)

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}

      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") || "form"
        fieldErrors[field] ??= issue.message
      }

      return mobileValidationError(
        "Please check your details and try again.",
        fieldErrors,
      )
    }

    const email = parsed.data.email.trim().toLowerCase()

    // Classification only. `registerUser` runs this same lookup and is the
    // gate; this call exists so a non-campus address is a 403 the client can
    // act on rather than an indistinguishable error string.
    const university = await findUniversityForEmail(email)

    if (!university) {
      return mobileError(
        "FORBIDDEN",
        "Cirqles is only open to students with a university email address. Use the address your campus gave you.",
      )
    }

    const result = await registerUser({ ...parsed.data, email })

    if (result.status === "error") {
      // Schema and domain both passed above, so what is left is an address that
      // already has an account.
      return mobileError("CONFLICT", result.message)
    }

    return mobileData(
      {
        email,
        university,
        role: "STUDENT",
        created: true,
        /**
         * The account is stored with `email_verified` null and the verification
         * mail is already on its way. Verification is never optional.
         */
        emailVerificationRequired: true,
        /** A new account has no interests yet, so the picker still has to run. */
        onboardingRequired: true,
        /** This endpoint issues no session. Sign in with the credentials next. */
        signInRequired: true,
        nextStep: "VERIFY_EMAIL",
      },
      undefined,
      201,
    )
  },
)
