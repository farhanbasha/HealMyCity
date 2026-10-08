/**
 * Municipal Infrastructure Priority Ranking Algorithm
 * ===================================================
 * 
 * Computes a fair, balanced, and tamper-resistant priority score (0 - 100)
 * for crowdsourced civic issues by synthesizing:
 * 
 * 1. AI Physical Hazard Severity (S ∈ [1, 10]):
 *    Normalized base physical threat evaluated by AI inspection.
 * 
 * 2. Community Upvote Saturation (V ≥ 0):
 *    Logarithmic scaling prevents viral brigade skew while reflecting
 *    real civic demand. Calibrated with a saturation threshold at 50 votes.
 * 
 * 3. Severity-Community Interaction (Synergy):
 *    Hazards that are BOTH severe and heavily confirmed by citizens receive
 *    compounded dispatch urgency.
 * 
 * Formula:
 *    S_norm = (severity / 10) * 100
 *    V_norm = min(100, (ln(1 + upvotes) / ln(1 + 50)) * 100)
 *    Score  = (0.40 * S_norm) + (0.35 * V_norm) + (0.25 * (S_norm * V_norm / 100))
 * 
 * Example Benchmark:
 * - Severity 6 with 50 votes: 0.40*60 + 0.35*100  + 0.25*60.0  = 24 + 35 + 15   = 74.0 (P1 Critical)
 * - Severity 8 with 10 votes: 0.40*80 + 0.35*61.0 + 0.25*48.8  = 32 + 21.4 + 12.2 = 65.6 (P2 High)
 * - Severity 8 with 8 votes:  0.40*80 + 0.35*55.9 + 0.25*44.7  = 32 + 19.6 + 11.2 = 62.8 (P2 High)
 * 
 * Output: Severity 6 with 50 votes correctly ranks higher than Severity 8 with 8-10 votes.
 */

export interface PriorityMetrics {
    score: number;          // 0 to 100 (rounded to 1 decimal place)
    tier: "P1 Critical" | "P2 High" | "P3 Medium" | "P4 Normal";
    tierColor: {
        bg: string;
        text: string;
        border: string;
    };
    severityNormalized: number;
    upvotesNormalized: number;
}

export const VOTE_SATURATION_CEILING = 50;

/**
 * Calculates priority score and tier for a given severity and upvote count.
 */
export function calculatePriorityMetrics(
    severity: number | null | undefined,
    upvotes: number | null | undefined
): PriorityMetrics {
    const s = Math.max(1, Math.min(10, severity ?? 5));
    const v = Math.max(0, upvotes ?? 0);

    // 1. Normalized Severity (10 to 100)
    const sNorm = (s / 10) * 100;

    // 2. Logarithmic Community Impact (0 to 100)
    const logDenom = Math.log(1 + VOTE_SATURATION_CEILING);
    const vNorm = Math.min(100, (Math.log(1 + v) / logDenom) * 100);

    // 3. Synergy term (severity * community impact)
    const synergy = (sNorm * vNorm) / 100;

    // 4. Composite Priority Score (0 to 100)
    const rawScore = (0.40 * sNorm) + (0.35 * vNorm) + (0.25 * synergy);
    const score = Math.round(rawScore * 10) / 10;

    // 5. Categorize into operational municipal triage tiers
    let tier: PriorityMetrics["tier"];
    let tierColor: PriorityMetrics["tierColor"];

    if (score >= 70) {
        tier = "P1 Critical";
        tierColor = {
            bg: "bg-[#FDEDEC]",
            text: "text-[#C02820]",
            border: "border-[#F8D7DA]",
        };
    } else if (score >= 50) {
        tier = "P2 High";
        tierColor = {
            bg: "bg-[#FDF5EB]",
            text: "text-[#9A5B00]",
            border: "border-[#FFE8CC]",
        };
    } else if (score >= 30) {
        tier = "P3 Medium";
        tierColor = {
            bg: "bg-[#EBF5FF]",
            text: "text-[#007AFF]",
            border: "border-[#B9E6FE]",
        };
    } else {
        tier = "P4 Normal";
        tierColor = {
            bg: "bg-[#F5F5F7]",
            text: "text-[#6E6E73]",
            border: "border-[#E5E5EA]",
        };
    }

    return {
        score,
        tier,
        tierColor,
        severityNormalized: Math.round(sNorm),
        upvotesNormalized: Math.round(vNorm),
    };
}

/**
 * Sorts and assigns explicit ranks (#1, #2, ...) to an array of issues.
 */
export function rankIssues<T extends {
    ai_severity_score?: number | null;
    upvote_count?: number;
    created_at?: string;
}>(items: T[]): (T & {
    priorityScore: number;
    priorityRank: number;
    priorityTier: PriorityMetrics["tier"];
    tierColor: PriorityMetrics["tierColor"];
    urgencyScore: number; // backward compatibility
})[] {
    // 1. Calculate metrics for all items
    const scored = items.map((item) => {
        const metrics = calculatePriorityMetrics(
            item.ai_severity_score,
            item.upvote_count
        );
        return {
            ...item,
            priorityScore: metrics.score,
            priorityTier: metrics.tier,
            tierColor: metrics.tierColor,
            urgencyScore: Math.round(metrics.score), // alias
            priorityRank: 0,
        };
    });

    // 2. Deterministic multi-criteria sorting:
    //    Primary: Priority Score (descending)
    //    Secondary: Upvote count (descending)
    //    Tertiary: Severity score (descending)
    //    Quaternary: Created date (older first for fair FIFO triage)
    scored.sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
            return b.priorityScore - a.priorityScore;
        }
        const votesA = a.upvote_count || 0;
        const votesB = b.upvote_count || 0;
        if (votesB !== votesA) {
            return votesB - votesA;
        }
        const sevA = a.ai_severity_score || 0;
        const sevB = b.ai_severity_score || 0;
        if (sevB !== sevA) {
            return sevB - sevA;
        }
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
    });

    // 3. Assign 1-indexed ranks
    return scored.map((item, index) => ({
        ...item,
        priorityRank: index + 1,
    }));
}
