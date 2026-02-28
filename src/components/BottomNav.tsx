import { Link, useLocation } from "react-router-dom";
import { MessageCircle, ClipboardList, BarChart3, BookOpen } from "lucide-react";

const tabs = [
  { path: "/", label: "Chat", icon: MessageCircle },
  { path: "/log", label: "Log", icon: ClipboardList },
  { path: "/weekly", label: "Reports", icon: BarChart3 },
  { path: "/resources", label: "Resources", icon: BookOpen },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                active ? "tab-active" : "tab-inactive"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
