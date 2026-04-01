import { Nav } from "@/components/nav";
import { RoutingDiagram } from "@/components/routing-diagram";
import { AwsArchitecture } from "@/components/aws-architecture";
import { Footer } from "../page";

export default function ArchitecturePage() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav />
      {/* Main Architecture Intro */}
      <section className="py-24 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-14 text-center">
            <p className="font-press-start mb-4" style={{ fontSize: "0.55rem", color: "var(--green)", letterSpacing: "0.1em" }}>
              // THE SYSTEM PIPELINE
            </p>
            <h2 className="font-press-start mb-3" style={{ fontSize: "clamp(1rem, 2.5vw, 1.8rem)", color: "var(--text)", lineHeight: 1.6 }}>
              ARCHITECTURE
            </h2>
            <p className="font-ibm-plex mt-4" style={{ color: "var(--muted)", margin: "0 auto", maxWidth: "600px", lineHeight: 1.8 }}>
              CodeSentinel seamlessly integrates into your workflow, analyzing code pushes immediately and routing the analysis through the optimal AI model based on complexity.
            </p>
          </div>
          <div className="space-y-6 lg:space-y-8">
            {[
              {
                step: "01",
                title: "CONTEXT DETECTED",
                color: "var(--purple)",
                body: "Security Context Agent identified AWS infrastructure code. Applied AWS Security Best Practices checklist (CIS AWS Foundations Benchmark).",
              },
              {
                step: "02",
                title: "COMPLEXITY SCORED",
                color: "var(--green)",
                body: "AI Classifier scored complexity 7/10. Security surface area: HIGH. Routed to Claude Sonnet for deep analysis.",
              },
              {
                step: "03",
                title: "FINDINGS GENERATED",
                color: "var(--red)",
                body: "2 findings in 1.4s. CWE-798 (Hardcoded credentials), CWE-94 (Debug flag). Fix suggestions included with each.",
              },
              {
                step: "04",
                title: "COST: $0.006",
                color: "var(--blue)",
                body: "Routed to Sonnet not Opus. Saved 60% vs always-Opus routing. Result stored in DynamoDB for audit trail.",
              },
            ].map((item) => (
              <div key={item.step} className="pixel-border p-6" style={{ background: "var(--bg2)" }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="font-press-start flex-shrink-0 text-xl" style={{ color: item.color }}>
                    [{item.step}]
                  </span>
                  <div>
                    <div className="font-press-start mb-2" style={{ fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.6 }}>
                      {item.title}
                    </div>
                    <p className="font-ibm-plex text-sm" style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Routing Pipeline */}
      <section id="how-it-works" className="py-20 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto text-center mb-10">
           <h3 className="font-press-start" style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)" }}>HOW IT WORKS PIPELINE</h3>
        </div>
        <RoutingDiagram />
      </section>

      {/* Detailed AWS Services Used Section */}
      <section className="py-24 px-6" style={{ background: "var(--bg)" }}>
        <div className="max-w-6xl mx-auto text-center mb-16">
          <p className="font-press-start mb-4" style={{ fontSize: "0.55rem", color: "var(--aws-orange)", letterSpacing: "0.1em" }}>
            // BACKEND
          </p>
          <h2 className="font-press-start mb-6" style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", color: "var(--text)", lineHeight: 1.6 }}>
            DETAILED AWS ARCHITECTURE
          </h2>
          <AwsArchitecture />
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="pixel-border p-8" style={{ background: "var(--bg2)" }}>
            <h3 className="font-press-start mb-4" style={{ fontSize: "0.8rem", color: "var(--aws-orange)", lineHeight: 1.6 }}>FRONTEND & INGRESS</h3>
            <p className="font-ibm-plex text-sm mb-6" style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              Static assets are served via Amazon S3 Website hosting and delivered globally through Amazon CloudFront. Ingress API requests hit the API Gateway which forwards payloads to the initial Lambda handlers in the Backend Layer.
            </p>
            <h3 className="font-press-start mb-4" style={{ fontSize: "0.8rem", color: "var(--purple)", lineHeight: 1.6 }}>INPUT PROCESSING</h3>
            <p className="font-ibm-plex text-sm" style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              S3 Uploads trigger the asynchronous validation pipeline. A Preprocessor Lambda initiates AWS Step Functions to robustly orchestrate the complex execution state without timing out.
            </p>
          </div>

          <div className="pixel-border p-8" style={{ background: "var(--bg2)" }}>
            <h3 className="font-press-start mb-4" style={{ fontSize: "0.8rem", color: "var(--green)", lineHeight: 1.6 }}>TASK PIPELINE & VALIDATION</h3>
            <p className="font-ibm-plex text-sm mb-6" style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              Work is efficiently parallelized into Code Analysis, Config Analysis, and IAM Evaluation Lambdas. The results are unified by an Aggregator and cross-checked against IAM Access Analyzer policies.
            </p>
            <h3 className="font-press-start mb-4" style={{ fontSize: "0.8rem", color: "var(--blue)", lineHeight: 1.6 }}>AI & KNOWLEDGE LAYER</h3>
            <p className="font-ibm-plex text-sm" style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              The Smart Routing Logic delegates to Amazon Bedrock models: Titan (Simple), Llama (Moderate), and Claude (Complex). It relies on OpenSearch (RAG) to inject precise Security Best Practices context. Telemetry flows accurately to CloudWatch, X-Ray, and a Results DB.
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
