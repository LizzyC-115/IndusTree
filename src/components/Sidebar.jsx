import { categories } from '../data/mockData';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { selectedCategory, setSelectedCategory } = useApp();

  return (
    <aside className="min-w-0 min-h-full flex flex-col" style={{ paddingTop: '18px', paddingBottom: '18px', paddingLeft: '20px', paddingRight: '20px' }}>

      <nav>
        <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', letterSpacing: '0.01em', marginBottom: '12px', paddingLeft: '4px' }}>
          Industries
        </h3>
        <ul>
          {categories.map((category, idx) => {
            const isActive = selectedCategory === category.id;
            return (
              <li key={category.id}>
                {idx > 0 && <div style={{ height: '1px', background: '#ffffff', margin: '0 4px' }} />}
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left border-l-2 transition-all ${
                    isActive
                      ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                  style={{ padding: '11px 12px', fontSize: '14px' }}
                >
                  {category.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

    </aside>
  );
}
