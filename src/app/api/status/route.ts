import { dbStatus } from "@/lib/server/db";
import { emailProviderStatus } from "@/lib/server/email";

/** Small diagnostics endpoint: which storage and which mailer are live. */
export async function GET() {
  return Response.json({ db: await dbStatus(), email: emailProviderStatus() });
}
