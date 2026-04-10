import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useGetMe, useGetDashboardStats, useGetResumes, useDeleteResume, getGetResumesQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Award, Plus, Trash2, BarChart3, Upload, ChevronRight, Star } from "lucide-react";
import { getAuthToken } from "@/hooks/useAuth";

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <Badge variant="outline" className="text-xs">Not analyzed</Badge>;
  if (score >= 80) return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 text-xs">{score}</Badge>;
  if (score >= 60) return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs">{score}</Badge>;
  return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 text-xs">{score}</Badge>;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const token = getAuthToken();

  const { data: user, isLoading: userLoading } = useGetMe({ query: { retry: false, enabled: !!token } });
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { enabled: !!token } });
  const { data: resumes, isLoading: resumesLoading } = useGetResumes({ query: { enabled: !!token } });
  const deleteMutation = useDeleteResume({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      },
    },
  });

  useEffect(() => {
    if (!token && !userLoading) {
      setLocation("/");
    }
  }, [token, userLoading]);

  const handleDelete = (id: number) => {
    if (confirm("Delete this resume?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || "..."}</p>
          </div>
          <Button asChild>
            <Link href="/upload">
              <Plus className="h-4 w-4 mr-2" />
              Upload Resume
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Resumes</p>
                  <p className="text-3xl font-bold mt-1">{statsLoading ? "..." : (stats?.totalResumes ?? 0)}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold mt-1">
                    {statsLoading ? "..." : (stats?.averageScore != null ? `${stats.averageScore}` : "N/A")}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Best Score</p>
                  <p className="text-3xl font-bold mt-1">
                    {statsLoading ? "..." : (stats?.bestScore != null ? stats.bestScore : "N/A")}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-3">
                  <Award className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumes List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Resumes</h2>
            <span className="text-sm text-muted-foreground">{resumes?.length ?? 0} total</span>
          </div>

          {resumesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-4">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !resumes?.length ? (
            <Card className="border-dashed">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No resumes yet</h3>
                <p className="text-muted-foreground mb-4 max-w-xs">Upload your resume to get detailed analysis, scoring, and improvement suggestions.</p>
                <Button asChild>
                  <Link href="/upload">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Your First Resume
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <Card key={resume.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{resume.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {resume.jobRole && <span className="mr-2">{resume.jobRole}</span>}
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <ScoreBadge score={resume.overallScore} />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/resume/${resume.id}`}>
                            <BarChart3 className="h-3.5 w-3.5 mr-1" />
                            Analyze
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(resume.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
