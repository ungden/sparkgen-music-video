import { FilmProvider } from "@/context/FilmContext";

export default function FilmLayout({ children }: { children: React.ReactNode }) {
  return <FilmProvider>{children}</FilmProvider>;
}
