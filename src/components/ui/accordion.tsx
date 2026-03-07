import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextType {
  openItem: string | null;
  setOpenItem: (id: string | null) => void;
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  defaultOpenId?: string;
}

export function Accordion({ children, className, defaultOpenId }: AccordionProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(defaultOpenId ?? null);

  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem }}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({
  id,
  title,
  description,
  icon,
  children,
  className,
}: AccordionItemProps) {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionItem must be used within an Accordion');
  }

  const { openItem, setOpenItem } = context;
  const isOpen = openItem === id;

  const handleToggle = () => {
    setOpenItem(isOpen ? null : id);
  };

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div>
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
