import type { InputBundle, AgentEnvelope, Theme, ThemeTier } from "../types.js";

interface ThemeItem {
  name: string;
  tier: ThemeTier;
  strength: number;
  leaders: string[];
  notes?: string;
}

interface AvoidTheme {
  name: string;
  reason: string;
}

interface ThemeHeatPayload {
  topThemes: ThemeItem[];
  avoidThemes: AvoidTheme[];
}

/**
 * theme_heat 工具
 * 分析题材热度并给出龙头/梯队信息
 */
export async function themeHeat(
  inputBundle: InputBundle
): Promise<AgentEnvelope<ThemeHeatPayload>> {
  const { themes = [], market } = inputBundle;

  // 按强度排序
  const sortedThemes = [...themes].sort((a, b) => b.strength - a.strength);

  // 找出主线和分支
  const topThemes: ThemeItem[] = sortedThemes
    .filter((t) => t.tier === "MAIN" || t.tier === "BRANCH")
    .slice(0, 5)
    .map((t) => ({
      name: t.name,
      tier: t.tier,
      strength: t.strength,
      leaders: t.leaders,
      notes: t.tier === "MAIN" ? "主线强势" : undefined,
    }));

  // 找出需要回避的题材
  const avoidThemes: AvoidTheme[] = sortedThemes
    .filter((t) => t.tier === "FADING" || t.strength < 0.3)
    .map((t) => ({
      name: t.name,
      reason: t.tier === "FADING" ? "退潮" : "强度不足",
    }));

  // 如果炸板率高，提示回避弱势题材
  if (market.bombRate > 0.3 && avoidThemes.length === 0) {
    avoidThemes.push({
      name: "弱势题材",
      reason: "炸板率高，回避非主线",
    });
  }

  return {
    type: "ThemeHeat",
    payload: {
      topThemes,
      avoidThemes,
    },
    meta: {
      agent: "theme_heat",
      version: "0.2.0",
      ts: new Date().toISOString(),
    },
  };
}
