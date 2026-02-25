import { Link } from "react-router-dom";
import { User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur-md">
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <Link
        to="/profile"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <User size={18} />
      </Link>
    </header>
  );
};

export default Header;
