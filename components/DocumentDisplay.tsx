import { Document } from "@prisma/client";
import { Library, PenLine } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

interface DocumentDisplayProps {
  document: Document;
}

const DocumentDisplay = ({ document }: DocumentDisplayProps) => {
  return (
    <div
      className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
    >
      <div className="flex items-center">
        <div className="mr-3 bg-primary/10 text-primary p-2 rounded-md">
          <Library className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{document.name}</p>
          <p className="text-xs text-muted-foreground">{document.type}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={document.fileUrl} target="_blank">
          <Button size="sm">
            Xem
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DocumentDisplay;
