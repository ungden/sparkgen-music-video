"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { useProject } from "@/context/ProjectContext";
import { Project } from "@/types/project";
import Link from "next/link";
import { useRouter } from "next/navigation";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    idea: "bg-surface-container-highest text-on-surface-variant",
    storyboard: "bg-tertiary-container text-on-tertiary-container",
    animation: "bg-tertiary-container text-on-tertiary-container",
    editing: "bg-primary-container text-on-primary-container",
    rendering: "bg-tertiary-container text-on-tertiary-container",
    finished: "bg-primary-container text-on-primary-container",
  };
  const labels: Record<string, string> = {
    idea: "Drafting",
    storyboard: "Storyboarding",
    animation: "Animating",
    editing: "Editing",
    rendering: "Rendering",
    finished: "Finished",
  };
  return (
    <span className={`text-xs font-black px-4 py-1.5 rounded-full flex items-center gap-2 w-fit ${styles[status] || styles.idea}`}>
      {(status === "storyboard" || status === "rendering" || status === "animation") && (
        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
      )}
      {labels[status] || "Draft"}
    </span>
  );
}

function getProjectImage(project: Project): string | null {
  if (project.scenes?.length) {
    const doneScene = project.scenes.find((s) => s.status === "done" && s.imageBase64);
    if (doneScene?.imageBase64) return `data:image/png;base64,${doneScene.imageBase64}`;
  }
  return null;
}

function getStepUrl(project: Project): string {
  if (project.status === "finished" || project.status === "editing") return `/project/${project.id}/editor`;
  if (project.status === "animation") return `/project/${project.id}/animation`;
  if (project.scenes?.some((s) => s.videoStatus === "done")) return `/project/${project.id}/editor`;
  if (project.scenes?.length) return `/project/${project.id}/animation`;
  if (project.lyrics) return `/project/${project.id}/storyboard`;
  return `/project/${project.id}/idea`;
}

export default function Dashboard() {
  const { projects, createProject } = useProject();
  const router = useRouter();

  const handleNewProject = () => {
    const id = createProject();
    router.push(`/project/${id}/idea`);
  };

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen p-8 lg:p-12">
        <TopNav />
        <div className="pt-20">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-black text-on-surface tracking-tight mb-2">My Studio</h2>
              <p className="text-on-surface-variant font-medium">Welcome back, time to make some magic!</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleNewProject}
                className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full font-black text-lg shadow-lg hover:opacity-90 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined filled">add_circle</span>
                New Project
              </button>
            </div>
          </header>

          {projects.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-on-secondary-container">movie_filter</span>
              </div>
              <h3 className="text-2xl font-black text-on-surface mb-2">No projects yet</h3>
              <p className="text-on-surface-variant mb-8 max-w-md">
                Create your first AI-powered music video in minutes. Just pick a theme and let the magic happen!
              </p>
              <button
                onClick={handleNewProject}
                className="flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-lg hover:opacity-90 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">add</span>
                Create Your First Video
              </button>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, i) => {
                  const image = getProjectImage(project);
                  const href = getStepUrl(project);
                  const isFeatured = i === 0 && projects.length > 2;

                  return (
                    <Link
                      key={project.id}
                      href={href}
                      className={`bg-surface-container-lowest rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow ${
                        isFeatured ? "lg:col-span-2" : ""
                      } ${isFeatured ? "relative overflow-hidden" : ""}`}
                    >
                      {isFeatured && (
                        <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-primary to-transparent" />
                      )}
                      <div className={`${isFeatured ? "relative z-10" : ""} flex flex-col h-full`}>
                        <div className="flex justify-between items-start mb-4">
                          <StatusBadge status={project.status} />
                          <span className="text-xs text-on-surface-variant">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={`${isFeatured ? "h-48" : "h-40"} rounded-2xl overflow-hidden mb-4`}>
                          {image ? (
                            <img className="w-full h-full object-cover" src={image} alt={project.title} />
                          ) : (
                            <div className="w-full h-full bg-surface-container border-2 border-dashed border-outline-variant/30 flex items-center justify-center rounded-2xl">
                              <span className="material-symbols-outlined text-4xl text-outline-variant opacity-50">image</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-lg font-black text-on-surface mb-1">{project.title}</h4>
                        <p className="text-sm text-on-surface-variant mb-4">
                          {project.scenes?.length
                            ? `${project.scenes.length} scenes`
                            : project.lyrics
                            ? "Lyrics ready"
                            : "Just started"}
                        </p>
                        <span className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-full font-bold bg-primary text-white hover:opacity-90 transition-all">
                          {project.status === "finished" ? (
                            <><span className="material-symbols-outlined filled text-sm">play_circle</span>Watch Video</>
                          ) : project.status === "idea" ? (
                            "Start Creating"
                          ) : (
                            "Continue Editing"
                          )}
                        </span>
                      </div>
                    </Link>
                  );
                })}

                {/* New Project CTA */}
                <div
                  onClick={handleNewProject}
                  className="bg-surface-container-low border-4 border-dashed border-white/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-on-secondary-container">add</span>
                  </div>
                  <h4 className="text-lg font-black text-on-surface">Start Something New</h4>
                  <p className="text-sm text-on-surface-variant mt-2 px-6">Got an idea? Turn it into a music video in minutes.</p>
                </div>
              </section>

              {/* Stats Section */}
              <section className="mt-12 flex flex-col lg:flex-row gap-8">
                <div className="flex-1 bg-gradient-to-r from-primary to-primary-dim p-8 rounded-2xl text-white flex justify-between items-center overflow-hidden relative">
                  <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <p className="text-on-primary/80 font-bold mb-1">Projects</p>
                    <h3 className="text-4xl font-black">{projects.length} <span className="text-lg font-medium opacity-60">created</span></h3>
                  </div>
                  <div className="relative z-10 w-24 h-24">
                    <svg className="w-full h-full text-white" viewBox="0 0 36 36">
                      <path className="stroke-current opacity-20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
                      <path className="stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${Math.min(projects.length * 10, 100)}, 100`} strokeLinecap="round" strokeWidth="3" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 bg-surface-container-high rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                    <span className="material-symbols-outlined filled text-tertiary text-3xl mb-2">image</span>
                    <h4 className="text-2xl font-black text-on-surface">
                      {projects.reduce((acc, p) => acc + (p.scenes?.filter((s) => s.status === "done").length || 0), 0)}
                    </h4>
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">AI Images</p>
                  </div>
                  <div className="flex-1 bg-surface-container-high rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                    <span className="material-symbols-outlined filled text-secondary text-3xl mb-2">lyrics</span>
                    <h4 className="text-2xl font-black text-on-surface">
                      {projects.filter((p) => p.lyrics).length}
                    </h4>
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Songs Written</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
