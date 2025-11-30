import Link from "next/link"
import { Search, Plus, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MOCK_PLAYS } from "@/lib/mock-data"

export default function Home() {
    return (
        <div className="min-h-screen bg-background p-8">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Theatre Play Coach</h1>
                    <p className="mt-2 text-muted-foreground">Your personal rehearsal companion.</p>
                </div>
                <Button asChild>
                    <Link href="/import">
                        <Plus className="mr-2 h-4 w-4" /> Import Play
                    </Link>
                </Button>
            </header>

            <div className="mb-8 flex items-center space-x-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search plays, authors, characters..." className="pl-10" />
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {MOCK_PLAYS.map((play) => (
                    <Card key={play.id} className="flex flex-col transition-all hover:border-primary/50 hover:shadow-lg">
                        <CardHeader>
                            <CardTitle className="line-clamp-1">{play.title}</CardTitle>
                            <CardDescription>{play.author} • {play.year}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                                {play.description}
                            </p>
                            <div className="mt-4 flex gap-2">
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
    )
}
