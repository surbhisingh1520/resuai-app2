import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetResume, useEnhanceResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight, ArrowRight, Tag, Layout as LayoutIcon, FileText, AlertCircle } from "lucide-react";

export default function EnhancePage() {
  const [, params] = useRoute("/resume/:id/enhance");
  const id = parseInt(params?.id ?? "0", 10);
  const [enhancement, setEnhancement] = useState<any>(null);

  const { data: resume } = useGetResume(id, {
    query: { enabled: !!id, queryKey: getGetResumeQueryKey(id) },
  });

  const enhanceMutation = useEnhanceResume({
    mutation: {
      onSuccess: (data) => {
        setEnhancement(data);
      },
    },
  });

  const handleEnhance = () => {
    enhanceMutation.mutate({ id });
  };

  const priorityColor = (p: string) => {
    if (p === "Critical") return "bg-red-500/10 text-red-600 border-red-500/30";
    if (p === "High") return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    if (p === "Medium") return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    return "bg-muted text-muted-foreground";
  };

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
            <span>Enhancement</span>
          </div>
          <h1 className="text-2xl font-bold">Resume Enhancement</h1>
          <p className="text-muted-foreground">Smart suggestions to make your resume stand out</p>
        </div>

        {/* Analyze Button */}
        {!enhancement && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-xl bg-primary/20 p-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Resume Enhancement</h3>
                    <p className="text-sm text-muted-foreground">Get specific suggestions with before/after examples to improve your resume</p>
                  </div>
                </div>
                <Button onClick={handleEnhance} disabled={enhanceMutation.isPending}>
                  {enhanceMutation.isPending ? (
                    <><span className="animate-spin inline-block mr-2">&#9679;</span>Analyzing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Enhance Resume</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhancement Results */}
        {enhancement && (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="flex flex-wrap gap-3">
              <div className="text-sm bg-muted px-3 py-1.5 rounded-full">
                {enhancement.enhancements?.length} suggestions found
              </div>
              <div className="text-sm bg-muted px-3 py-1.5 rounded-full">
                {enhancement.keywordsToAdd?.length} keywords to add
              </div>
              <Button variant="outline" size="sm" onClick={handleEnhance} disabled={enhanceMutation.isPending}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Re-run Analysis
              </Button>
            </div>

            {/* Rewritten Summary */}
            {enhancement.rewrittenSummary && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    Rewritten Professional Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{enhancement.rewrittenSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Enhancement Items */}
            <div>
              <h2 className="font-semibold mb-3">Improvement Suggestions</h2>
              <div className="space-y-4">
                {enhancement.enhancements?.map((item: any, i: number) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{item.section}</Badge>
                            <Badge variant="outline" className={`text-xs ${priorityColor(item.priority)}`}>
                              {item.priority}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm">{item.issue}</h3>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{item.suggestion}</p>
                      </div>

                      {(item.originalText || item.improvedText) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.originalText && (
                            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                              <p className="text-xs font-medium text-red-600 mb-1">Current</p>
                              <p className="text-xs text-muted-foreground">{item.originalText}</p>
                            </div>
                          )}
                          {item.improvedText && (
                            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                              <p className="text-xs font-medium text-green-600 mb-1">Improved</p>
                              <p className="text-xs">{item.improvedText}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Keywords to Add */}
            {enhancement.keywordsToAdd?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Keywords to Add
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {enhancement.keywordsToAdd.map((kw: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-primary/5 border-primary/30 text-primary">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formatting Tips */}
            {enhancement.formattingTips?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LayoutIcon className="h-4 w-4 text-primary" />
                    Formatting Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {enhancement.formattingTips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
