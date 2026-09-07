import NewPropertyForm from "./NewPropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold mb-6">List a property</h1>
        <NewPropertyForm />
      </div>
    </div>
  );
}
