import { createSharedRecord } from "@/lib/sharedRecordRoute";
export async function POST(request: Request, context: { params: Promise<{ petId: string }> }) {
  return createSharedRecord(request, (await context.params).petId, "vaccines");
}
