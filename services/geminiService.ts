import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

export const getEncouragement = async (taskName: string, completedCount: number, totalCount: number): Promise<string> => {
  try {
    const prompt = `
      User just finished a task: "${taskName}".
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
      The user has a difficult task: "${taskName}" that is rated high difficulty and long duration.
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

export const generateDailySummary = async (tasks: any[]): Promise<string> => {
  try {
    const taskDetails = tasks.map(t => {
      const diff = (t.actualMinutes || t.estimatedMinutes) - t.estimatedMinutes;
      return `- ${t.name} (${t.subject}): Est ${t.estimatedMinutes}m, Act ${t.actualMinutes}m. Diff: ${diff}m. Reason: ${t.completionReason || 'None'}`;
    }).join('\n');

    const totalEst = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
    const totalAct = tasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
    const efficiency = totalAct < totalEst ? "Efficient" : totalAct > totalEst ? "Took longer than expected" : "On time";

    const prompt = `
      The user has finished all their tasks for the day.
      Total Estimated Time: ${totalEst} min.
      Total Actual Time: ${totalAct} min.
      Overall Efficiency: ${efficiency}.
      
      Task Details:
      ${taskDetails}

      Please act as a friendly and wise study coach. Write a short daily summary (about 2-3 sentences) in Chinese.
      1. Acknowledge their effort.
      2. Point out one specific thing based on the data (e.g., "You did math very quickly" or "Physics took longer than planned, maybe estimate more time next time").
      3. Give a suggestion for tomorrow.
      Use emojis.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "今天辛苦了！任务全部完成，好好休息，明天继续加油！🌟";
  }
};

export const getDailyReflection = async (
  tasks: { name: string; estimated: number }[],
  userFeeling: string
): Promise<string> => {
  try {
    const taskListStr = tasks.map(t => `${t.name} (${t.estimated}分钟)`).join(", ");
    const prompt = `
      User has finished all tasks today.
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