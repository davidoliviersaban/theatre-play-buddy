import Link from "next/link"
import { ArrowLeft, CheckCircle2, TrendingUp, RotateCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SessionSummaryPage({ params }: { params: { id: string } }) {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex rounded-full bg-green-500/10 p-4">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Session Complete!</h1>
                    <p className="mt-2 text-muted-foreground">Great work on &quot;Romeo and Juliet&quot;. Here&apos;s how you did.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Lines Rehearsed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">42</div>
                            <p className="text-xs text-muted-foreground">+12 from last session</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">94%</div>
                            <p className="text-xs text-green-500 flex items-center">
                                <TrendingUp className="mr-1 h-3 w-3" /> +2.5%
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Hints Used</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">3</div>
                            <p className="text-xs text-muted-foreground">Mostly in Act 1, Scene 2</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-semibold">Focus Areas</h2>
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                <div className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-medium">Act 1, Scene 1</p>
                                        <p className="text-sm text-muted-foreground">Mastery: High</p>
                                    </div>
                                    <div className="h-2 w-24 rounded-full bg-secondary">
                                        <div className="h-2 w-[90%] rounded-full bg-green-500" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-medium">Act 1, Scene 2</p>
                                        <p className="text-sm text-muted-foreground">Mastery: Medium</p>
                                    </div>
                                    <div className="h-2 w-24 rounded-full bg-secondary">
                                        <div className="h-2 w-[60%] rounded-full bg-yellow-500" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" /> Back to Library
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/practice/${params.id}`}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Practice Again
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
