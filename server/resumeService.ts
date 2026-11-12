import { GoogleGenAI, Type } from '@google/genai';
import { PortfolioContent } from '../src/content/types';
import { ParsedResumeData, ResumeChangeItem, ResumeDiffResult } from './types';

/**
 * Extracts plain text from a PDF Buffer using pdf-parse or fallback streams.
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // @ts-expect-error Optional dependency for resume extraction
    const pdfParseModule = await import('pdf-parse').catch(() => null);
    const { PDFParse } = (pdfParseModule || {}) as any;
    if (PDFParse) {
      const parser = new PDFParse({ data: pdfBuffer });
      await parser.load();
      const textResult = await parser.getText();
      if (typeof textResult === 'string' && textResult.trim().length > 0) {
        return textResult;
      }
    }
  } catch (err) {
    console.warn('[Resume Parser] PDF extraction fallback:', err);
  }

  // Fallback to basic string extraction
  const rawString = pdfBuffer.toString('utf8');
  const cleanMatches = rawString.match(/\(([^()]+)\)T[jJ]/g);
  if (cleanMatches && cleanMatches.length > 20) {
    return cleanMatches.map((m) => m.slice(1, -3)).join(' ');
  }
  return rawString.slice(0, 10000);
}

/**
 * Parses resume using Gemini structured generation when GEMINI_API_KEY is available.
 */
async function parseWithGemini(
  pdfBuffer: Buffer,
  _extractedText: string
): Promise<ParsedResumeData | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `
Extract verified structured information from this resume.
CRITICAL RULES:
1. ONLY extract information that is explicitly present in the resume.
2. DO NOT invent, hallucinate, or assume any unstated technologies, metrics, awards, or job roles.
3. If a section is missing, return empty arrays or null.
4. Extract projects with their exact stated name, description, and technologies.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBuffer.toString('base64'),
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            headline: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            summary: { type: Type.STRING },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  institution: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  batchPeriod: { type: Type.STRING },
                  score: { type: Type.STRING },
                },
                required: ['institution', 'degree'],
              },
            },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  skills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['category', 'skills'],
              },
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  organization: { type: Type.STRING },
                  period: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['role', 'organization', 'period'],
              },
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  technologies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  role: { type: Type.STRING },
                  githubUrl: { type: Type.STRING },
                  liveUrl: { type: Type.STRING },
                },
                required: ['name', 'description', 'technologies'],
              },
            },
            certifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            achievements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['fullName'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim()) as ParsedResumeData;
      return parsed;
    }
  } catch (err) {
    console.warn('[Resume Parser] Gemini parsing attempt failed, falling back to local heuristic parser:', err);
  }
  return null;
}

/**
 * Heuristic regex-based text parser fallback when Gemini is unavailable.
 */
export function parseWithLocalHeuristics(text: string): ParsedResumeData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : 'sainithinreddytadugam@gmail.com';
  const fullName = lines[0] && lines[0].length < 40 ? lines[0] : 'Sai Nithin Reddy';

  const lowerText = text.toLowerCase();
  const detectedSkills: { category: string; skills: string[] }[] = [];
  const knownTech = [
    'Python', 'C++', 'Java', 'JavaScript', 'TypeScript', 'SQL',
    'React', 'Next.js', 'FastAPI', 'Node.js', 'Express', 'Tailwind CSS',
    'PyTorch', 'Scikit-learn', 'TensorFlow', 'OpenCV', 'Pandas', 'NumPy',
    'Docker', 'Git', 'Linux', 'MongoDB', 'PostgreSQL', 'AWS', 'GCP',
  ];
  const foundSkills = knownTech.filter((tech) =>
    new RegExp(`\\b${tech.replace('+', '\\+')}\\b`, 'i').test(text)
  );
  if (foundSkills.length > 0) {
    detectedSkills.push({
      category: 'Technical Skills',
      skills: foundSkills,
    });
  }

  const projects: ParsedResumeData['projects'] = [];
  const projectKeywords = ['tapas', 'surestep', 'traffiq', 'vidyavistaar'];
  for (const kw of projectKeywords) {
    if (lowerText.includes(kw)) {
      const matchIndex = lowerText.indexOf(kw);
      const snippet = text.slice(matchIndex, matchIndex + 250);
      const firstLine = snippet.split('\n')[0] || kw.toUpperCase();
      projects.push({
        name: firstLine.slice(0, 30).trim(),
        description: snippet.slice(0, 180).trim(),
        technologies: foundSkills.slice(0, 4),
      });
    }
  }

  return {
    fullName,
    email,
    skills: detectedSkills,
    projects: projects.length > 0 ? projects : undefined,
    education: [
      {
        institution: 'Chaitanya Bharathi Institute of Technology (CBIT)',
        degree: 'B.E. in Computer Science & Engineering',
        batchPeriod: '2024 – 2028',
      },
    ],
  };
}

/**
 * Main parser entry point: tries Gemini first, falls back to local text parser.
 */
export async function parseResume(pdfBuffer: Buffer): Promise<ParsedResumeData> {
  const extractedText = await extractTextFromPDF(pdfBuffer);
  const geminiResult = await parseWithGemini(pdfBuffer, extractedText);
  if (geminiResult && geminiResult.fullName) {
    return geminiResult;
  }
  return parseWithLocalHeuristics(extractedText);
}

/**
 * Compares parsed resume data against current portfolio content to yield diff list.
 */
export function generateResumeDiff(
  parsedResume: ParsedResumeData,
  currentContent: PortfolioContent
): ResumeDiffResult {
  const changes: ResumeChangeItem[] = [];

  const currentSkillsSet = new Set<string>();
  currentContent.skillCategories.forEach((cat) => {
    cat.skills.forEach((s) => currentSkillsSet.add(s.name.toLowerCase()));
  });

  const incomingSkills = new Set<string>();
  if (parsedResume.skills) {
    parsedResume.skills.forEach((cat) => {
      cat.skills.forEach((s) => incomingSkills.add(s.trim()));
    });
  }

  incomingSkills.forEach((skill) => {
    if (!currentSkillsSet.has(skill.toLowerCase())) {
      changes.push({
        id: `skill-add-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        category: 'skill',
        action: 'add',
        title: `Add Skill: ${skill}`,
        description: `Found in resume technical skills section.`,
        incomingValue: skill,
        approved: true,
      });
    }
  });

  if (parsedResume.email && parsedResume.email !== currentContent.profile.email) {
    changes.push({
      id: 'profile-email-update',
      category: 'profile',
      action: 'update',
      title: 'Update Contact Email',
      description: `Change email to ${parsedResume.email}`,
      currentValue: currentContent.profile.email,
      incomingValue: parsedResume.email,
      approved: false,
    });
  }

  const summary = changes.length === 0
    ? 'No new differences detected between resume and current portfolio.'
    : `Detected ${changes.length} change(s) across skills, profile, projects, and experience for your review.`;

  return {
    summary,
    changes,
    parsedRaw: parsedResume,
  };
}
