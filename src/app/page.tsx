import Link from "next/link";
import { Search, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MOCK_PLAYS } from "@/lib/mock-data";
import { PlayCardStats, PlayCardProgress } from "@/components/play-card-stats";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Theatre Play Coach
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
            Your personal rehearsal companion.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/import">
            <Plus className="mr-2 h-4 w-4" /> Import Play
          </Link>
        </Button>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plays, authors, characters..."
            className="pl-10"
          />
        </div>
      </div>

      <div
        className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
        suppressHydrationWarning
      >
        {MOCK_PLAYS.map((play) => (
          <Card
            key={play.id}
            className="flex flex-col transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <CardHeader>
              <CardTitle className="line-clamp-1">{play.title}</CardTitle>
              <CardDescription>
                {play.author} • {play.year}
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <PlayCardProgress play={play} />
                <PlayCardStats play={play} />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="line-clamp-4 text-sm text-muted-foreground sm:line-clamp-3">
                {play.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {play.genre}
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {play.characters.length} Characters
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="secondary">
                <Link href={`/play/${play.id}`}>
                  <BookOpen className="mr-2 h-4 w-4" /> Open Play
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
