import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { Card } from "@/components/ui/card";
import { Flame, Trophy, Calendar } from "lucide-react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalReadingDays: number;
  lastReadingDate: string | null;
  streakCalendar: { date: string; count: number }[];
}

export function ReadingStreak() {
  const { user } = useSession();

  const { data: streakData, isLoading } = useQuery({
    queryKey: ["reading-streak", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<StreakData> => {
      // Get all reading progress entries with timestamps
      const { data: progressEntries, error } = await supabase
        .from("reading_progress")
        .select("updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (!progressEntries || progressEntries.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          totalReadingDays: 0,
          lastReadingDate: null,
          streakCalendar: [],
        };
      }

      // Extract unique dates (YYYY-MM-DD format)
      const dates = progressEntries
        .map((entry: { updated_at: string }) => {
          const date = new Date(entry.updated_at);
          return date.toISOString().split("T")[0];
        })
        .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index) // Remove duplicates
        .sort((a: string, b: string) => b.localeCompare(a)); // Sort descending

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      // Check if user read today or yesterday to have an active streak
      if (dates[0] === today || dates[0] === yesterday) {
        currentStreak = 1;
        tempStreak = 1;

        for (let i = 1; i < dates.length; i++) {
          const currentDate = new Date(dates[i - 1]);
          const prevDate = new Date(dates[i]);
          const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / 86400000);

          if (diffDays === 1) {
            tempStreak++;
            if (dates[i - 1] === today || dates[i - 1] === yesterday) {
              currentStreak = tempStreak;
            }
          } else {
            tempStreak = 1;
          }

          longestStreak = Math.max(longestStreak, tempStreak);
        }
      }

      // Generate calendar for last 30 days
      const streakCalendar = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000);
        const dateStr = date.toISOString().split("T")[0];
        const hasActivity = dates.includes(dateStr);
        streakCalendar.push({
          date: dateStr,
          count: hasActivity ? 1 : 0,
        });
      }

      return {
        currentStreak,
        longestStreak,
        totalReadingDays: dates.length,
        lastReadingDate: dates[0],
        streakCalendar,
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6 bg-card/60 backdrop-blur border-border/60">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-12 w-full bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (!streakData || streakData.currentStreak === 0) {
    return (
      <Card className="p-6 bg-card/60 backdrop-blur border-border/60">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Reading Streak</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Start reading today to build your streak!
        </p>
        <div className="flex gap-1">
          {streakData?.streakCalendar.slice(-7).map((day) => (
            <div
              key={day.date}
              className={`flex-1 h-8 rounded ${
                day.count > 0 ? "bg-primary/20" : "bg-muted/30"
              }`}
              title={day.date}
            />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur border-orange-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Flame className="h-6 w-6 text-orange-500" />
            {streakData.currentStreak >= 7 && (
              <div className="absolute -top-1 -right-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Reading Streak</h3>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-500">{streakData.currentStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
      </div>

      {/* Streak Calendar Heatmap */}
      <div className="mb-4">
        <div className="flex gap-1 mb-1">
          {streakData.streakCalendar.map((day) => (
            <div
              key={day.date}
              className={`flex-1 h-8 rounded transition-all ${
                day.count > 0
                  ? "bg-gradient-to-t from-orange-500/40 to-orange-500/20"
                  : "bg-muted/20"
              }`}
              title={`${day.date}: ${day.count > 0 ? "Read" : "No activity"}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">Best Streak</p>
            <p className="text-sm font-semibold">{streakData.longestStreak} days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Total Days</p>
            <p className="text-sm font-semibold">{streakData.totalReadingDays}</p>
          </div>
        </div>
      </div>

      {streakData.currentStreak >= 7 && (
        <div className="mt-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-center text-yellow-700 dark:text-yellow-300">
            🔥 Amazing! {streakData.currentStreak} day streak! You're on fire!
          </p>
        </div>
      )}
    </Card>
  );
}