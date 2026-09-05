import { AuthEntryButtons } from "@/components/auth-entry-buttons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminHomePage() {
  return (
    <main className="canvas-dot-grid flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-[var(--border-default)] bg-[var(--bg-surface)]">
        <CardHeader>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">CEMVP</p>
            <h1 className="mt-1 text-2xl font-semibold">Admin App Placeholder</h1>
          </div>
          <Avatar>
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            This placeholder keeps the forum visual system intact while the admin control surface is incrementally built.
          </p>
          <Input placeholder="Search admin controls" />
          <AuthEntryButtons />
          <div className="flex flex-wrap gap-2">
            <Button>Open control center</Button>
            <Button variant="secondary">Moderation queue</Button>
            <Button variant="ghost">Theme ready</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
