import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

export const getEncouragement = async (taskName: string, completedCount: number, totalCount: number): Promise<string> => {
  try {
    const prompt = `
      User just finished a homework task: "${taskName}".
      Progress: ${completedCount}/${totalCount} tasks done today.
      
      Generate a short, punchy, cheerful, single-sentence encouragement message in Chinese. 
      Use emojis. 
      If they are halfway done, mention they are on a roll.
      If they are all done, celebrate loudly.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "太棒了！继续保持！🔥"; // Fallback
  }
};

export const getFatigueAdvice = async (taskName: string): Promise<string> => {
  try {
    const prompt = `
      The user has a difficult homework task: "${taskName}" that is rated high difficulty and long duration.
      Generate a very short (1 sentence) friendly advice in Chinese suggesting they split it up or drink water.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    return "这个任务比较难，记得适度休息哦！💧";
  }
};

export const getDailyReflection = async (
  tasks: { name: string; estimated: number }[],
  userFeeling: string
): Promise<string> => {
  try {
    const taskListStr = tasks.map(t => `${t.name} (${t.estimated}分钟)`).join(", ");
    const prompt = `
      User has finished all homework today.
      Tasks completed: ${taskListStr}.
      User feels the workload was: "${userFeeling}".
      
      Act as a kind time-management coach. Give 1-2 sentences of specific advice in Chinese for tomorrow's planning based on their feeling.
      If "Too much", suggest overestimating time next time.
      If "Easy", suggest challenging themselves slightly more or enjoying free time.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    return "辛苦啦！明天也要根据自己的节奏合理安排哦！🌙";
  }
};
