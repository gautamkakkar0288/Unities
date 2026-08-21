import { requireMobileSession } from "@/lib/api/mobile/auth"
import { readJsonObject } from "@/lib/api/mobile/body"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import {
  mobileData,
  mobileFailure,
  mobileValidationError,
} from "@/lib/api/mobile/response"
import { registerDeviceSchema } from "@/lib/schemas/device"
import { registerDeviceToken } from "@/lib/services/devices"

/**
 * POST /api/mobile/devices - remember this handset.
 *
 * Push is not implemented. Nothing in this project sends a notification to a
 * phone, and this endpoint does not pretend otherwise: it stores where a device
 * could be reached, and that is all it claims to do.
 *
 * The owner is the session. A token registered while signed in as one student
 * belongs to that student, and the upsert in `registerDeviceToken` moves it if
 * somebody else signs in on the same device.
 *
 * The response deliberately does not include the token. Validation runs here as
 * well as in the service so a bad platform can name the field it came from; the
 * service re-validates and remains the authority.
 */
export const POST = withMobileRoute(
  "POST /api/mobile/devices",
  async (request: Request) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const body = await readJsonObject(request)
    if (!body.ok) return body.response

    const parsed = registerDeviceSchema.safeParse(body.value)

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}

      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") || "form"
        fieldErrors[field] ??= issue.message
      }

      return mobileValidationError(
        "That device could not be registered.",
        fieldErrors,
      )
    }

    const result = await registerDeviceToken({
      userId: authenticated.session.userId,
      input: parsed.data,
    })

    if (!result.ok) return mobileFailure(result)

    return mobileData(result.data, undefined, 201)
  },
)
