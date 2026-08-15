import TrackShipmentContent, {
  type RequiredField,
  type TrackingData,
} from "@/components/public/TrackShipmentContent";

export const dynamic = "force-dynamic";

export default async function TrackShipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ trackId?: string }>;
}) {
  const { trackId } = await searchParams;

  let initialTrackingData: TrackingData | null = null;
  let initialNeededFields: RequiredField[] | null = null;
  let initialError = "";

  if (trackId) {
    const base = process.env.PUBLIC_APP_URL || "http://localhost:3000/";
    try {
      const res = await fetch(`${base}api/v1/tracks/${trackId.trim()}`, {
        cache: "no-store",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = (await res.json()) as any;
      if (res.ok && json?.data) {
        initialTrackingData = json.data as TrackingData;
      } else if (
        json?.meta?.needsFields &&
        Array.isArray(json?.meta?.requiredFields) &&
        json.meta.requiredFields.length
      ) {
        initialNeededFields = json.meta.requiredFields as RequiredField[];
      } else {
        initialError = json?.message || "Tracking number not found";
      }
    } catch {
      initialError = "Failed to fetch tracking information. Please try again.";
    }
  }

  return (
    <TrackShipmentContent
      initialTrackId={trackId || ""}
      initialTrackingData={initialTrackingData}
      initialError={initialError}
      initialNeededFields={initialNeededFields}
    />
  );
}
