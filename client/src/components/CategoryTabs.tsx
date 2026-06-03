import { categories } from "./config";

type Props = {
  activeCategory: string;
  onChange: (category: string) => void;
};

export function CategoryTabs({ activeCategory, onChange }: Props) {
  return (
    <div className="category-tabs">
      {categories.map((category) => (
        <button
          className={`tab-button ${activeCategory === category.key ? "is-active" : ""}`}
          key={category.key}
          type="button"
          onClick={() => onChange(category.key)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
