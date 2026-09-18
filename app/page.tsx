import { StudentHome } from "@/features/home/student-home";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-background">
      <StudentHome />
      <BottomNav />
    </main>
  );
}
