import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetResume, useGetInterviewQuestions, getGetResumeQueryKey, getGetInterviewQuestionsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronRight, Lightbulb, Code, Users, Brain, Building } from "lucide-react";

const categoryIcons: Record<string, any> = {
  Technical: Code,
  Behavioral: Users,
  Situational: Brain,
  "Culture Fit": Building,
};

const difficultyColors: Record<string, string> = {
  Easy: "bg-green-500/10 text-green-600 border-green-500/30",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Hard: "bg-red-500/10 text-red-600 border-red-500/30",
};

export default function InterviewPage() {
  const [, params] = useRoute("/resume/:id/interview");
  const id = parseInt(params?.id ?? "0", 10);

  const { data: resume } = useGetResume(id, {
    query: { enabled: !!id, queryKey: getGetResumeQueryKey(id) },
  });

  const { data: questionsData, isLoading } = useGetInterviewQuestions(id, {
    query: { enabled: !!id, queryKey: getGetInterviewQuestionsQueryKey(id) },
  });

  const categories = ["Technical", "Behavioral", "Situational", "Culture Fit"];

  const groupedQuestions = categories.reduce((acc: Record<string, any[]>, cat) => {
    acc[cat] = questionsData?.questions?.filter((q: any) => q.category === cat) ?? [];
    return acc;
  }, {});

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/resume/${id}`} className="hover:text-foreground">{resume?.title ?? "Resume"}</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Interview Prep</span>
          </div>
          <h1 className="text-2xl font-bold">Interview Preparation</h1>
          <p className="text-muted-foreground">Curated interview questions based on your resume and target role</p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-primary">
                <MessageSquare className="h-6 w-6 animate-bounce" />
                <p className="font-medium">Generating personalized interview questions...</p>
              </div>
            </div>
            {[1,2,3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {questionsData && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <div className="text-sm bg-muted px-3 py-1.5 rounded-full">
                {questionsData.questions?.length} total questions
              </div>
              {categories.map((cat) => (
                groupedQuestions[cat].length > 0 && (
                  <div key={cat} className="text-sm bg-muted px-3 py-1.5 rounded-full">
                    {groupedQuestions[cat].length} {cat}
                  </div>
                )
              ))}
            </div>

            {/* Questions by Category */}
            {categories.map((category) => {
              const questions = groupedQuestions[category];
              if (!questions.length) return null;
              const Icon = categoryIcons[category] || MessageSquare;

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-lg">{category}</h2>
                    <Badge variant="secondary" className="text-xs">{questions.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {questions.map((q: any, i: number) => (
                      <Card key={i} className="hover:border-primary/30 transition-colors">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <p className="font-medium text-sm flex-1">{q.question}</p>
                            <Badge variant="outline" className={`text-xs shrink-0 ${difficultyColors[q.difficulty] ?? ""}`}>
                              {q.difficulty}
                            </Badge>
                          </div>
                          <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                            <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">{q.tip}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
