import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // Assuming Badge is installed or add it: npx shadcn@latest add badge
import { Filter } from 'lucide-react'; // Icon for filter controls
import { Button } from '@/components/ui/button'; // For filter button

// Placeholder data - replace with actual data fetching and filtering later
const threatLogs = [
  { id: 'scan_1', type: 'URL', input: 'http://malicious-site.xyz', result: 'Dangerous', score: 0.9, date: '2023-10-26 10:30' },
  { id: 'scan_2', type: 'Email', input: 'Subject: Urgent Account Update', result: 'Phishing', score: 0.98, date: '2023-10-26 09:15' },
  { id: 'scan_3', type: 'Threat', input: 'powershell -enc ...', result: 'Malicious', severity: 'High', date: '2023-10-25 14:00' },
  { id: 'scan_4', type: 'URL', input: 'http://google.com', result: 'Safe', score: 0.1, date: '2023-10-25 11:05' },
  { id: 'scan_5', type: 'Email', input: 'Subject: Meeting Confirmation', result: 'Safe', score: 0.05, date: '2023-10-24 16:20' },
  // Add more logs...
];

// Helper to determine badge variant based on result/severity
const getBadgeVariant = (result: string): "default" | "destructive" | "outline" | "secondary" => {
  switch (result?.toLowerCase()) {
    case 'dangerous':
    case 'phishing':
    case 'malicious':
      return "destructive";
    case 'suspicious':
    case 'risky':
      return "secondary"; // Or choose another color like yellow if you customize Badge
    case 'safe':
    case 'benign':
      return "default"; // Default usually maps to green/blue or primary
    default:
      return "outline";
  }
};

const ThreatIntelligencePage = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Threat Intelligence Feed</h1>
        <p className="text-muted-foreground">Overview of recent threats detected across the platform.</p>
      </header>

      {/* TODO: Add Filter Controls (Dropdowns for Type, Severity, Date Range) */}
       <div className="flex justify-end space-x-2">
         <Button variant="outline">
           <Filter className="mr-2 h-4 w-4" /> Filters
         </Button>
       </div>

      <Table>
        <TableCaption>A list of recent threat detections.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Scan ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Result/Level</TableHead>
            <TableHead>Input (Truncated)</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {threatLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs">{log.id}</TableCell>
              <TableCell>{log.type}</TableCell>
              <TableCell>
                <Badge variant={getBadgeVariant(log.result || log.severity || 'Unknown')}>
                  {log.result || log.severity || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate" title={log.input}>{log.input}</TableCell>
              <TableCell>{log.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* TODO: Add Pagination Controls */}
    </div>
  );
};

export default ThreatIntelligencePage; 