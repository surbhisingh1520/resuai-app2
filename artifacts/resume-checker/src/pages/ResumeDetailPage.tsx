import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetResume, useAnalyzeResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Sparkles, MessageSquare, CheckCircle, XCircle, Target, TrendingUp, Shield, Eye, Zap, ChevronRight, BarChart3 } from "lucide-react";

interface ScoreGaugeProps {
  score: number;
  label: string;
  color?: string;
}

function ScoreGauge({ score, label, color = "#6366f1" }: ScoreGaugeProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            strokeWidth="8"
            stroke="currentColor"
            className="text-muted/30"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            strokeWidth="8"
            stroke={scoreColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
          />
        </svg>
        <span className="absolute text-xl font-bold" style={{ color: scoreColor }}>{score}</span>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export default function ResumeDetailPage() {
  const [, params] = useRoute("/resume/:id");
  const id = parseInt(params?.id ?? "0", 10);
  const queryClient = useQueryClient();
  const [analysis, setAnalysis] = useState<any>(null);
  const [jobRole, setJobRole] = useState("");

  const { data: resume, isLoading: resumeLoading } = useGetResume(id, {
    query: { enabled: !!id, queryKey: getGetResumeQueryKey(id) },
  });

  const analyzeMutation = useAnalyzeResume({
    mutation: {
      onSuccess: (data) => {
        setAnalysis(data);
        queryClient.invalidateQueries({ queryKey: getGetResumeQueryKey(id) });
      },
    },
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate({ id, data: jobRole ? { jobRole } : {} });
  };

  if (resumeLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-5 gap-4 mt-8">
              {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!resume) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Resume not found</p>
          <Button asChild className="mt-4"><Link href="/dashboard">Go to Dashboard</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <span>Resume Analysis</span>
            </div>
            <h1 className="text-2xl font-bold">{resume.title}</h1>
            {resume.jobRole && <p className="text-muted-foreground">{resume.jobRole}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/resume/${id}/enhance`}><Sparkles className="h-4 w-4 mr-1.5" />Enhance</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/resume/${id}/interview`}><MessageSquare className="h-4 w-4 mr-1.5" />Interview Prep</Link>
            </Button>
          </div>
        </div>

        {/* Analyze Panel */}
        {!analysis && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-xl bg-primary/20 p-3">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Run Full Analysis</h3>
                    <p className="text-sm text-muted-foreground">Get detailed scoring, skill detection, and career guidance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="text-sm border rounded-lg px-3 py-1.5 bg-background"
                    placeholder="Target role (optional)"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                  />
                  <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
                    {analyzeMutation.isPending ? (
                      <><span className="animate-spin mr-2">&#9679;</span>Analyzing...</>
                    ) : (
                      <><Brain className="h-4 w-4 mr-2" />Analyze Now</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing score summary if resume was analyzed before */}
        {!analysis && resume.overallScore != null && (
          <Card className="mb-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{resume.overallScore}</div>
                <div>
                  <p className="font-medium">Previous Analysis Score</p>
                  <p className="text-sm text-muted-foreground">Run a new analysis to get detailed insights</p>
                </div>
                <Button variant="outline" className="ml-auto" onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Re-analyze
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Score Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Score Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap justify-around gap-4">
                  <ScoreGauge score={analysis.overallScore} label="Overall Score" />
                  <ScoreGauge score={analysis.atsScore} label="ATS Score" />
                  <ScoreGauge score={analysis.clarityScore} label="Clarity" />
                  <ScoreGauge score={analysis.impactScore} label="Impact" />
                  <ScoreGauge score={analysis.toneScore} label="Tone" />
                  {analysis.jobRoleMatch != null && (
                    <ScoreGauge score={analysis.jobRoleMatch} label="Role Match" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Expert Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
                {analysis.toneAnalysis && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Tone Analysis</p>
                    <p className="text-sm">{analysis.toneAnalysis}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 shrink-0 mt-0.5">&#10003;</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-amber-500" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.weaknesses?.map((w: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-500 shrink-0 mt-0.5">!</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Detected Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Detected Skills ({analysis.detectedSkills?.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.detectedSkills?.map((skill: any, i: number) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      <span>{skill.name}</span>
                      <span className="text-xs opacity-60">· {skill.level}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  Missing Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.missingSkills?.map((skill: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge
                        className={`text-xs shrink-0 ${skill.importance === "Critical" ? "bg-red-500/10 text-red-600 border-red-500/30" : skill.importance === "High" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-blue-500/10 text-blue-600 border-blue-500/30"}`}
                        variant="outline"
                      >
                        {skill.importance}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{skill.name}</p>
                        <p className="text-xs text-muted-foreground">{skill.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Career Paths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Recommended Career Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.careerPaths?.map((path: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border flex items-center gap-4">
                      <div className="text-2xl font-bold text-primary shrink-0 w-12 text-center">{path.match}%</div>
                      <div>
                        <p className="font-medium">{path.role}</p>
                        <p className="text-xs text-muted-foreground">{path.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <Button asChild>
                <Link href={`/resume/${id}/enhance`}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Enhancement Suggestions
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/resume/${id}/interview`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Generate Interview Questions
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Resume Content Preview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Resume Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto">
              {resume.content}
            </pre>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
