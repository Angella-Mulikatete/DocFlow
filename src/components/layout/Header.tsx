import { Workflow } from 'lucide-react';
import type { FC } from 'react';

const Header: FC = () => {
  return (
    <header className="py-6">
      <div className="container mx-auto flex items-center space-x-3">
        <Workflow className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">
          DocuFlow Automate
        </h1>
      </div>
    </header>
  );
};

export default Header;
