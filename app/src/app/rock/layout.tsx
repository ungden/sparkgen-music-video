import { RockProvider } from "@/context/RockContext";

export const dynamic = "force-dynamic";

export default function RockLayout({ children }: { children: React.ReactNode }) {
  return <RockProvider>{children}</RockProvider>;
}
