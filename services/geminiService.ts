import { GoogleGenAI } from "@google/genai";
import { TimeBlock, ProductivityConfig, AnalysisResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert operations analyst for retail and restaurants. 
Your goal is to analyze staffing schedules and sales data to find inefficiencies.
Provide concise, actionable advice to managers. Focus on "Sales Per Labor Hour" (SPLH), FOH/BOH split adherence, and over/understaffing risks.
Avoid generic advice. Be specific to the numbers and targets provided.
`;

export const analyzeSchedule = async (
  blocks: TimeBlock[],
  config: ProductivityConfig
): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Summarize data with precise naming as requested
    const hourlySummary = blocks.reduce((acc, block) => {
      const h = block.hourLabel;
      if (!acc[h]) {
        acc[h] = { 
          sales: 0, 
          scheduledFOH: 0, 
          scheduledBOH: 0, 
          recommendedFOH: 0, 
          recommendedBOH: 0 
        };
      }
      acc[h].sales += block.salesForecast;
      acc[h].scheduledFOH += block.scheduledFOH;
      acc[h].scheduledBOH += block.scheduledBOH;
      acc[h].recommendedFOH += block.recommendedFOH;
      acc[h].recommendedBOH += block.recommendedBOH;
      return acc;
    }, {} as Record<string, { 
      sales: number; 
      scheduledFOH: number; 
      scheduledBOH: number; 
      recommendedFOH: number; 
      recommendedBOH: number 
    }>);

    const prompt = `
      Analyze the following hourly staffing summary against our operational targets.
      
      Operational Targets:
      - Productivity Goal: $${config.targetSalesPerPersonPer15Min} Sales Per Person Per 15m.
      - Target Labor Split: ${config.fohPercentage}% Front of House (FOH) / ${config.bohPercentage}% Back of House (BOH).
      - Minimum Floor Headcount: ${config.minStaff} total staff.
      
      Hourly Data Summary:
      ${JSON.stringify(hourlySummary, null, 2)}

      Tasks for Analysis:
      1. Variance Check: Identify hours where 'scheduled' staff deviates significantly from 'recommended' staff.
      2. Split Check: Determine if the FOH/BOH ratio in the schedule aligns with the ${config.fohPercentage}/${config.bohPercentage} target.
      3. Efficiency: Highlight periods of low productivity (overstaffing) or high service risk (understaffing).

      Return your response strictly in JSON format:
      {
        "summary": "A 2-sentence high-level overview of the schedule quality.",
        "keyInsights": [
          "Specific data-backed recommendation 1",
          "Specific data-backed recommendation 2",
          "Specific data-backed recommendation 3"
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    let text = response.text;
    if (!text) return { summary: "No data returned from analysis.", keyInsights: [] };

    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(json)?/, '').replace(/```$/, '');
    }

    try {
      return JSON.parse(text) as AnalysisResult;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, text);
      return {
        summary: "Error processing the analysis result.",
        keyInsights: ["Please refresh and try again."]
      };
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "The AI analyst is currently unavailable.",
      keyInsights: ["Check your connectivity or API configuration."]
    };
  }
};