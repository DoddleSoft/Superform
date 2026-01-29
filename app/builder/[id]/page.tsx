import { BuilderMain } from "@/components/builder/BuilderMain";
import { getFormById, getFormSubmissions } from "@/actions/form";
import { notFound } from "next/navigation";

export default async function BuilderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Validate UUID format to prevent 22P02 DB error
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isValidUUID) {
        notFound();
    }

    try {
        const form = await getFormById(id);
        if (!form) {
            notFound();
        }

        // Fetch submissions, defaulting to empty array if fails or none
        let submissions = [];
        try {
            submissions = await getFormSubmissions(id);
        } catch (error) {
            console.error("Failed to fetch submissions:", JSON.stringify(error, null, 2));
            // We don't want to block the builder if fetching submissions fails, 
            // but strictly speaking getFormSubmissions throws on error.
            // We'll swallow it effectively or default to [].
        }

        return <BuilderMain form={form} submissions={submissions || []} />;
    } catch (error) {
        console.error("Error loading builder:", error);
        throw error; // Let Next.js error boundary handle it, or could redirect.
    }
}
