import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LessonAttachment {
  type: 'image' | 'pdf' | 'audio' | 'link' | 'text';
  data: string;
  mimeType?: string;
}

export async function generateLessonPlan(params: {
  classLevel: string;
  subject: string;
  topic: string;
  topics?: string[]; // For weekly plan
  isWeekly?: boolean;
  time: string;
  date: string;
  duration: string;
  motivation: string;
  teachingMaterial: string;
  fiveE: string;
  assessment: string;
  homework: string;
  language: string;
  format: 'simple' | 'column';
  attachments?: LessonAttachment[];
}) {
  const langMap: Record<string, string> = {
    en: 'English',
    ur: 'Urdu',
    ar: 'Arabic',
    sd: 'Sindhi',
    pa: 'Punjabi',
    ps: 'Pashto',
    bl: 'Balochi'
  };
  const targetLang = langMap[params.language] || params.language;

  const isWeekly = params.isWeekly;
  
  let promptText = `
    Generate a detailed ${isWeekly ? 'WEEKLY' : 'DAILY'} lesson plan in ${targetLang} for the following:
    Class: ${params.classLevel}
    Subject: ${params.subject}
    ${isWeekly ? `Topics for the week: ${params.topics?.join(', ')}` : `Topic Name: ${params.topic}`}
    Total Time: ${params.time}
    Date: ${params.date}
    Duration: ${params.duration}
    
    IMPORTANT REQUIREMENTS:
    1. SLOs (Student Learning Outcomes): MUST be SMART (Specific, Measurable, Achievable, Relevant, Time-bound).
    2. Learning Methodology (Teaching Approach, Method, and Techniques): You MUST suggest and describe the best pedagogical methods (e.g., Inquiry-based, Collaborative, etc.) for this specific topic and class level. This MUST be placed at the very beginning of the 5E Model section/column.
    3. Assessment: MUST be according to the Cognitive Domain 6 levels (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating).
    4. 5E Model (Engage, Explore, Explain, Elaborate, Evaluate): MUST start with the Learning Methodology (Teaching Approach), then incorporate Active Learning Methodology within each phase. DO NOT use a separate heading for Active Learning Methodology.
    5. Formatting: DO NOT use <br> tags in standard text. However, WITHIN table cells, you MUST use <br> for line breaks to separate points, as Markdown tables do not support real newlines. Each point MUST start with a number (1., 2., 3., etc.).
    6. Line Breaks: Ensure there is a clear double line break (Enter/New Line twice) between each numbered point in 'simple' format. For 'column' format, use <br> between points inside the same cell. For Urdu, Sindhi, and other RTL languages, ensure the numbering is on the correct side (e.g., 1. Text).
    
    ${params.attachments && params.attachments.length > 0 ? "ALSO: I have provided additional materials (images, PDFs, audio, links, or text). Please use the content from these materials to inform and structure the lesson plan." : ""}
    
    Motivation/Hook: ${params.motivation}
    Teaching Material: ${params.teachingMaterial}
    5E Model (incorporating Learning Methodology and Active Learning): ${params.fiveE}
    Assessment: ${params.assessment}
    Homework: ${params.homework}

    Format Requirements:
    - If the format is 'column', you MUST generate ONLY a Markdown Table. DO NOT provide a simple document. 
      ${isWeekly ? "For a WEEKLY plan, generate a table with rows for each topic (up to 6 topics)." : ""}
      The table columns MUST be:
      | Date | Topic Name | Duration | SMART SLOs | Material to be Used | 5E Model (Start with Learning Methodology/Teaching Approach, then Engage, Explore, Explain, Elaborate, Evaluate) | Assessment (6 Levels) | Assignment | Reflection/Feedback (1. What was my most challenging moment and how will I respond next time? 2. What were good and bad about the experience?) |
      
      CRITICAL: The entire lesson plan MUST be contained within this table. Each row should represent a specific topic or day. Use <br> (HTML break) for line breaks WITHIN table cells to separate points. Ensure each point within a cell starts with a number (1., 2., etc.).
    - If the format is 'simple', you MUST generate a standard document with headings and bullet points. DO NOT provide a table. Ensure headings for Topic Name, Duration, SMART SLOs, 5E Model (Starting with Learning Methodology/Teaching Approach, then 5E steps with Active Learning), Assessment (6 Levels), and Reflection/Feedback (including: What was my most challenging moment and how will I respond next time? What were good and bad about the experience?) are included. Use \n\n (double newlines) between sections and points. Every point in every section MUST be numbered (1., 2., 3., etc.).
    
    Ensure the output strictly follows the requested format: ${params.format === 'column' ? 'COLUMNWISE TABLE' : 'SIMPLE DOCUMENT'}.
  `;

  const parts: any[] = [];
  const tools: any[] = [];

  if (params.attachments) {
    for (const attachment of params.attachments) {
      if (attachment.type === 'image' || attachment.type === 'pdf' || attachment.type === 'audio') {
        parts.push({
          inlineData: {
            mimeType: attachment.mimeType || (attachment.type === 'pdf' ? 'application/pdf' : attachment.type === 'audio' ? 'audio/mpeg' : 'image/jpeg'),
            data: attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data
          }
        });
      } else if (attachment.type === 'text') {
        promptText += `\nAdditional Reference Text: ${attachment.data}`;
      } else if (attachment.type === 'link') {
        promptText += `\nReference Link: ${attachment.data}`;
        if (!tools.some(t => t.urlContext)) {
          tools.push({ urlContext: {} });
        }
      }
    }
  }

  // Add the prompt text as the first part
  parts.unshift({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: tools.length > 0 ? { tools } : undefined
    });
    return response.text;
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    throw error;
  }
}
