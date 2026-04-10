import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useCreateResume, getGetResumesQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, ArrowRight, FilePlus, CheckCircle, X, Loader2, FileUp, AlignLeft } from "lucide-react";

const EXAMPLE_RESUME = `Surbhi Singh
Product Manager | surbhi@example.com | +91 98765 43210 | LinkedIn: linkedin.com/in/surbhisingh

PROFESSIONAL SUMMARY
Dynamic Product Manager with 4+ years of experience driving product strategy and cross-functional execution in fast-paced tech environments. Proven ability to translate business goals into impactful product features. Passionate about user-centric design and data-driven decision making.

EXPERIENCE

Senior Product Manager - InnovateTech Solutions (2022 - Present)
• Led end-to-end launch of 3 major product features adopted by 500K+ users
• Improved user retention by 32% through targeted onboarding redesign
• Collaborated with engineering, design, and marketing to ship on time
• Managed product roadmap across 2 teams using Agile methodology

Product Manager - Digital Ventures Pvt. Ltd. (2020 - 2022)
• Defined product requirements for fintech platform serving 200+ enterprise clients
• Reduced customer complaints by 45% via streamlined UX improvements
• Conducted 60+ user interviews to drive feature prioritization

EDUCATION
B.Tech, Computer Science - Delhi Technological University (2020)
CGPA: 8.7/10

SKILLS
Product: Roadmapping, User Research, A/B Testing, Agile, PRD Writing, Wireframing
Technical: SQL, JIRA, Figma, Google Analytics, Mixpanel, Excel
Soft Skills: Leadership, Stakeholder Management, Strategic Thinking, Communication

CERTIFICATIONS
• Google Product Management Certificate (2022)
• Pragmatic Institute PMC Level I (2021)

PROJECTS
- Built internal analytics dashboard reducing reporting time by 60%
- Launched referral program generating 15% of new user signups`;

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text.trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("paste");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [fileJobRole, setFileJobRole] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const createMutation = useCreateResume({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setLocation(`/resume/${data.id}`);
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Failed to save resume. Please try again.");
        setFileError(err?.data?.error || "Failed to save resume. Please try again.");
      },
    },
  });

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("Please provide a title and resume content.");
      return;
    }
    createMutation.mutate({ data: { title, content, jobRole: jobRole || undefined } });
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFileError("");
    if (!fileTitle.trim() || !fileContent.trim()) {
      setFileError("Please upload a file and provide a title.");
      return;
    }
    createMutation.mutate({ data: { title: fileTitle, content: fileContent, jobRole: fileJobRole || undefined } });
  };

  const processFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext || "")) {
      setFileError("Only PDF and Word (.docx) files are supported.");
      return;
    }
    setExtracting(true);
    setFileError("");
    try {
      let text = "";
      if (ext === "pdf") {
        text = await extractPdfText(file);
      } else {
        text = await extractDocxText(file);
      }
      if (!text || text.length < 50) {
        setFileError("Could not extract text from this file. Please paste your resume manually.");
        return;
      }
      setSelectedFile(file);
      setFileContent(text);
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.[^.]+$/, ""));
      }
    } catch {
      setFileError("Failed to read the file. Please ensure it is a valid PDF or Word document.");
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const useExample = () => {
    if (activeTab === "paste") {
      setTitle("Product Manager Resume – Surbhi Singh");
      setContent(EXAMPLE_RESUME);
      setJobRole("Senior Product Manager");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Add Your Resume</h1>
          <p className="text-muted-foreground mt-1">Upload a file or paste your resume text to get a detailed analysis and score.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-sm mb-6">
            <TabsTrigger value="file" className="gap-2">
              <FileUp className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2">
              <AlignLeft className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
          </TabsList>

          {/* FILE UPLOAD TAB */}
          <TabsContent value="file">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-primary mb-3">Supported formats</p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> PDF (.pdf)</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> Word Document (.docx)</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">Max file size: 10MB. Text is extracted automatically from your file.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FilePlus className="h-5 w-5 text-primary" />
                      Upload Resume File
                    </CardTitle>
                    <CardDescription>Drag & drop or click to upload your PDF or Word file</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleFileSubmit} className="space-y-5">
                      {!selectedFile ? (
                        <div
                          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {extracting ? (
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="h-10 w-10 text-primary animate-spin" />
                              <p className="text-sm text-muted-foreground">Reading your file...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="rounded-full bg-primary/10 p-4">
                                <Upload className="h-8 w-8 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">Drop your file here or click to browse</p>
                                <p className="text-sm text-muted-foreground mt-1">Supports PDF and Word (.docx) files</p>
                              </div>
                              <Button type="button" variant="outline" size="sm" className="mt-2">
                                Choose File
                              </Button>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-primary/5 border-primary/20">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{selectedFile.name}</p>
                              <p className="text-xs text-muted-foreground">{fileContent.length} characters extracted</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setSelectedFile(null); setFileContent(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="file-title">Resume Title</Label>
                        <Input
                          id="file-title"
                          placeholder="e.g. Software Engineer Resume 2025"
                          value={fileTitle}
                          onChange={(e) => setFileTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="file-jobRole">Target Job Role <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                          id="file-jobRole"
                          placeholder="e.g. Senior Software Engineer, Product Manager"
                          value={fileJobRole}
                          onChange={(e) => setFileJobRole(e.target.value)}
                        />
                      </div>

                      {fileError && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{fileError}</p>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createMutation.isPending || !selectedFile || extracting}
                        size="lg"
                      >
                        {createMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                        ) : (
                          <>Analyze Resume <ArrowRight className="h-4 w-4 ml-2" /></>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PASTE TEXT TAB */}
          <TabsContent value="paste">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-primary mb-3">Tips for best results</p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Include your complete resume text</li>
                      <li>• Keep formatting minimal — plain text works best</li>
                      <li>• Add your target job role for tailored feedback</li>
                      <li>• Include achievements with numbers and percentages</li>
                      <li>• List all relevant skills and tools</li>
                    </ul>
                  </CardContent>
                </Card>

                <div>
                  <Button variant="outline" className="w-full" onClick={useExample} type="button">
                    <FileText className="h-4 w-4 mr-2" />
                    Load Sample Resume
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Try the sample to see how it works</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlignLeft className="h-5 w-5 text-primary" />
                      Paste Resume Text
                    </CardTitle>
                    <CardDescription>Copy and paste your resume content below</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleTextSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="title">Resume Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g. Software Engineer Resume 2025"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jobRole">Target Job Role <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                          id="jobRole"
                          placeholder="e.g. Senior Software Engineer, Product Manager"
                          value={jobRole}
                          onChange={(e) => setJobRole(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="content">Resume Content</Label>
                        <Textarea
                          id="content"
                          placeholder="Paste your complete resume text here..."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={18}
                          className="font-mono text-sm resize-none"
                          required
                        />
                        <p className="text-xs text-muted-foreground">{content.length} characters</p>
                      </div>

                      {error && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
                      )}

                      <Button type="submit" className="w-full" disabled={createMutation.isPending} size="lg">
                        {createMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                        ) : (
                          <>Analyze Resume <ArrowRight className="h-4 w-4 ml-2" /></>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
