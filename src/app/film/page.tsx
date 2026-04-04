"use client";

import FilmSidebar from "@/components/film/FilmSidebar";
import FilmTopNav from "@/components/film/FilmTopNav";
import { useFilm } from "@/context/FilmContext";
import { FilmProject } from "@/types/film";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getStepUrl(p: FilmProject): string {
  if (p.status === "finished" || p.status === "editing") return `/film/${p.id}/editor`;
  if (p.status === "animation") return `/film/${p.id}/animation`;
  if (p.scenes?.length) return `/film/${p.id}/animation`;
  if (p.script) return `/film/${p.id}/storyboard`;
  return `/film/${p.id}/idea`;
}

export default function FilmDashboard() {
  const { projects, createProject, deleteProject } = useFilm();
  const router = useRouter();

  const handleNew = async () => {
    const id = await createProject();
    router.push(`/film/${id}/idea`);
  };

  return (
    <>
      <FilmSidebar />
      <main className="ml-0 md:ml-64 min-h-screen p-4 md:p-8 lg:p-12">
        <FilmTopNav />
        <div className="pt-20">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-black text-on-surface tracking-tight mb-2">My Films</h2>
              <p className="text-on-surface-variant font-medium">Create AI-powered animated short films</p>
            </div>
            <button onClick={handleNew} className="flex items-center gap-2 bg-violet-600 text-white px-8 py-4 rounded-full font-black text-lg shadow-lg hover:opacity-90 transition-all active:scale-95">
              <span className="material-symbols-outlined filled">add_circle</span>
              New Film
            </button>
          </header>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-violet-600">movie_filter</span>
              </div>
              <h3 className="text-2xl font-black text-on-surface mb-2">No films yet</h3>
              <p className="text-on-surface-variant mb-8 max-w-md">Create your first AI-powered animated short film. Pick a style, let AI write the script, and watch your story come to life.</p>
              <button onClick={handleNew} className="flex items-center gap-2 bg-violet-600 text-white px-8 py-4 rounded-full font-black text-lg shadow-lg hover:opacity-90 active:scale-95">
                <span className="material-symbols-outlined">add</span>
                Create Your First Film
              </button>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => {
                const href = getStepUrl(project);
                const image = project.scenes?.find((s) => s.status === "done" && s.imageBase64);
                return (
                  <Link key={project.id} href={href} className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black px-4 py-1.5 rounded-full bg-violet-100 text-violet-700">{project.status}</span>
                      <span className="text-xs text-on-surface-variant">{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="h-40 rounded-2xl overflow-hidden mb-4 bg-surface-container">
                      {image?.imageBase64 ? (
                        <img className="w-full h-full object-cover" src={`data:image/png;base64,${image.imageBase64}`} alt={project.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-outline-variant opacity-50">movie</span>
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-black text-on-surface mb-1">{project.title}</h4>
                    <p className="text-sm text-on-surface-variant mb-4">{project.scenes?.length ? `${project.scenes.length} scenes` : project.script ? "Script ready" : "Just started"}</p>
                    <span className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-full font-bold bg-violet-600 text-white hover:opacity-90">
                      {project.status === "finished" ? "Watch Film" : "Continue"}
                    </span>
                  </Link>
                );
              })}
              <div onClick={handleNew} className="bg-surface-container-low border-4 border-dashed border-white/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-violet-600">add</span>
                </div>
                <h4 className="text-lg font-black text-on-surface">New Film</h4>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
