import { getFormContentByUrl } from "@/actions/form";
import { FormSubmitComponent } from "@/components/FormSubmitComponent";
import { notFound } from "next/navigation";

export default async function SubmitPage({
    params,
}: {
    params: Promise<{ formUrl: string }>;
}) {
    const { formUrl } = await params;
    const form = await getFormContentByUrl(formUrl);

    if (!form || !form.content) {
        notFound();
    }

    return (
        <FormSubmitComponent 
            formUrl={formUrl} 
            content={form.content} 
            formId={form.id} 
            style={form.style ?? 'classic'}
            version={form.version ?? 1}
        />
    );
}
