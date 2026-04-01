import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppHomePage() {
  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to NimbusPDF</CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Architecture-first foundation for a premium PDF editor.
          </p>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/viewer">Open PDF Viewer</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
