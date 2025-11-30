import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPlayById } from "@/lib/api/plays";
import { PlayDetailsClient } from "./play-details-client";

export default async function PlayDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let play;
  try {
    play = await fetchPlayById(id);
  } catch (error) {
    return (
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="outline" size="icon" className="h-10 w-10" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <h1 className="text-2xl font-bold">Play Not Found</h1>
          <p className="text-muted-foreground">
            The play with ID "{id}" could not be found.
          </p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <PlayDetailsClient play={play} />
    </div>
  );
}
