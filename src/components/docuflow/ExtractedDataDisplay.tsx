'use client';

import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PackageSearch } from 'lucide-react';

interface ExtractedDataDisplayProps {
  data: Record<string, unknown> | null;
}

const renderValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {renderValue(item)}
          </Badge>
        ))}
      </div>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <pre className="text-xs bg-muted p-2 rounded-md whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <span className="text-muted-foreground italic">N/A</span>;
};

const ExtractedDataDisplay: FC<ExtractedDataDisplayProps> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return null; 
  }

  const entries = Object.entries(data);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
         <PackageSearch className="h-6 w-6 text-primary" />
          Extracted Data
        </CardTitle>
        <CardDescription>
          The following data has been automatically extracted from the document.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <ScrollArea className="h-[300px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%] font-semibold">Field</TableHead>
                  <TableHead className="font-semibold">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium capitalize break-words">{key.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="break-all">{renderValue(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-center py-4">No data was extracted, or the extracted data is empty.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExtractedDataDisplay;
