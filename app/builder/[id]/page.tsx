export default async function BuilderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Form Builder</h1>
            <p className="text-gray-500 mt-2">Form ID: {id}</p>
        </div>
    );
}
