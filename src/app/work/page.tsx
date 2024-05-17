import WorkBox from "@/components/work/WorkBox";
import TiltBox from "@/components/Tiltbox";
import ProjectBox from "@/components/work/ProjectBox";
import { Metadata } from "next";
import PageMeta from "@/lib/pageMetadata";

export const metadata: Metadata = PageMeta({
  title: "Work & Project",
  description: "Companies, Projects and Open-source projects",
  url: "https://hanshal101.github.io/hanshal101/work/",
});

export default function Work() {
  return (
    <>
      <h1 className="text-xl font-bold">
        <span className="opacity-30">#</span> Open-source Projects
      </h1>
      <ProjectBox
        url="https://github.com/glasskube/glasskube/commits/main/?author=hanshal101"
        name="Glasskube"
        language="GoLang"
        description="🧊 The next generation Package Manager for Kubernetes 📦        "
      />
      <ProjectBox
        url="https://github.com/cyclops-ui/cyclops/commits/main/?author=hanshal101"
        name="Cyclops-UI"
        language="GoLang"
        description="Customizable UI for Kubernetes Workloads 👁️."
      />
      <ProjectBox
        url="https://github.com/apache/incubator-devlake/commits/main/?author=hanshal101"
        name="Apache DevLake"
        language="GoLang"
        description="Apache DevLake (Incubating) is an open-source dev data platform that ingests, analyzes, and visualizes the fragmented data from DevOps tools to extract insights for engineering excellence, developer experience, and community growth."
      />
      <ProjectBox
        url="https://github.com/apache/eventmesh/commits/master/?author=hanshal101"
        name="Apache EventMesh"
        language="Markdown(Docs)"
        description="EventMesh is a new generation serverless event middleware for building distributed event-driven applications."
      />
    </>
  );
}
