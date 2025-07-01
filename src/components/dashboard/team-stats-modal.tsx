// components/dashboard/team-stats-modal.tsx
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spa, Microservice } from "@/app/data/schema";

interface TeamStatsModalProps {
  spaData: Spa[];
  msData: Microservice[];
}

interface TeamStats {
  [key: string]: {
    spaCount: number;
    msCount: number;
  }
}

export function TeamStatsModal({ spaData, msData }: TeamStatsModalProps) {
  const stats: TeamStats = {};

  // Aggregate data by team
  [...spaData, ...msData].forEach(item => {
    const team = item.subgroupName;
    if (!stats[team]) {
      stats[team] = { spaCount: 0, msCount: 0 };
    }
    if ('homepage' in item) { // It's an SPA
      stats[team].spaCount++;
    } else { // It's a Microservice
      stats[team].msCount++;
    }
  });

  const sortedTeams = Object.keys(stats).sort();

  return (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle>Team Migration Stats</DialogTitle>
        <DialogDescription>
          A summary of migrated components for each team.
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Team Name</TableHead>
              <TableHead className="font-bold text-right">SPAs</TableHead>
              <TableHead className="font-bold text-right">Microservices</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map(team => (
              <TableRow key={team}>
                <TableCell>{team}</TableCell>
                <TableCell className="text-right">{stats[team].spaCount}</TableCell>
                <TableCell className="text-right">{stats[team].msCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  );
}