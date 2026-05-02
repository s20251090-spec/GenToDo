import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  ai: router({
    generateDailyPlan: publicProcedure
      .input(z.object({
        totalPlan: z.string(),
        examScope: z.string(),
        examDate: z.string(),
        dailyTheme: z.string(),
        dailyGoal: z.string(),
        completedHistory: z.array(z.object({
          taskContent: z.string(),
          completedAt: z.string(),
        })).default([]),
      }))
      .mutation(async ({ input }) => {
        const { generateDailyPlan, parsePlanOutput, validatePlanOutput } = await import("./ai-service");
        try {
          const output = await generateDailyPlan(input);
          const isValid = validatePlanOutput(output);
          const tasks = isValid ? parsePlanOutput(output) : [];
          return { rawOutput: output, tasks, isValid, success: true };
        } catch (error) {
          throw new Error(`Failed to generate plan: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }),

    generate: publicProcedure
      .input(z.object({ prompt: z.string() }))
      .mutation(async ({ input }) => {
        if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
          throw new Error("AI API not configured");
        }

        try {
          const response = await fetch(`${ENV.forgeApiUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${ENV.forgeApiKey}`,
            },
            body: JSON.stringify({
              model: "manus-1.6-lite",
              messages: [
                {
                  role: "user",
                  content: input.prompt,
                },
              ],
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error("Forge API error:", error);
            throw new Error(`Forge API error: ${response.status}`);
          }

          const data = await response.json();
          
          // Handle different response formats
          let result = "";
          if (data.choices && data.choices[0] && data.choices[0].message) {
            result = data.choices[0].message.content;
          } else if (data.result) {
            result = data.result;
          } else if (data.content) {
            result = data.content;
          } else if (data.text) {
            result = data.text;
          }

          return {
            result,
            success: true,
          };
        } catch (error) {
          console.error("AI generation error:", error);
          throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
