import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Filter } from "lucide-react";

interface ProductFiltersProps {
  filters: {
    categoryId: string;
    petType: string;
    minPrice?: number;
    maxPrice?: number;
    search: string;
    inStock: boolean;
    sortBy: string;
    sortOrder: string;
  };
  categories: Array<{ id: string; name: string; slug: string }>;
  onFilterChange: (filters: any) => void;
  onAskAiClick?: () => void;
}

export default function ProductFilters({ filters, categories, onFilterChange, onAskAiClick }: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 500]);

  const petTypes = [
    { id: "dog", label: "Dogs" },
    { id: "cat", label: "Cats" },
    { id: "bird", label: "Birds" },
    { id: "fish", label: "Fish" },
    { id: "small-animal", label: "Small Animals" },
  ];

  const brands = [
    "Royal Canin",
    "Blue Buffalo",
    "Hill's Science Diet",
    "Purina Pro Plan",
    "Wellness",
    "Orijen",
  ];

  const handlePetTypeChange = (petType: string, checked: boolean) => {
    onFilterChange({
      petType: checked ? petType : ""
    });
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    onFilterChange({
      categoryId: checked ? categoryId : ""
    });
  };

  const handleInStockChange = (checked: boolean) => {
    onFilterChange({
      inStock: checked
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    onFilterChange({
      minPrice: values[0] > 0 ? values[0] : undefined,
      maxPrice: values[1] < 500 ? values[1] : undefined
    });
  };

  const clearFilters = () => {
    setPriceRange([0, 500]);
    onFilterChange({
      categoryId: "",
      petType: "",
      minPrice: undefined,
      maxPrice: undefined,
      inStock: false
    });
  };

  const activeFilterCount = [
    filters.categoryId,
    filters.petType,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center" data-testid="text-filters-title">
          <Filter className="w-4 h-4 mr-2" />
          Smart Filters
        </h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Pet Type Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Pet Type</Label>
          <div className="space-y-3">
            {petTypes.map((pet) => (
              <div key={pet.id} className="flex items-center space-x-2">
                <Checkbox
                  id={pet.id}
                  checked={filters.petType === pet.id}
                  onCheckedChange={(checked) => handlePetTypeChange(pet.id, !!checked)}
                  data-testid={`checkbox-pet-${pet.id}`}
                />
                <Label htmlFor={pet.id} className="text-sm cursor-pointer">
                  {pet.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Category Filter */}
        {categories.length > 0 && (
          <>
            <div>
              <Label className="text-sm font-medium mb-3 block">Category</Label>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={filters.categoryId === category.id}
                      onCheckedChange={(checked) => handleCategoryChange(category.id, !!checked)}
                      data-testid={`checkbox-category-${category.id}`}
                    />
                    <Label htmlFor={category.id} className="text-sm cursor-pointer">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Price Range</Label>
          <div className="px-3 py-4">
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              max={500}
              min={0}
              step={5}
              className="w-full"
              data-testid="slider-price-range"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}+</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Brand Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Popular Brands</Label>
          <div className="space-y-3">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={brand}
                  data-testid={`checkbox-brand-${brand.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Label htmlFor={brand} className="text-sm cursor-pointer">
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Stock Status */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Availability</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={filters.inStock}
              onCheckedChange={handleInStockChange}
              data-testid="checkbox-in-stock"
            />
            <Label htmlFor="inStock" className="text-sm cursor-pointer">
              In stock only
            </Label>
          </div>
        </div>

        <Separator />

        {/* AI Enhancement */}
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Get personalized recommendations based on your pet's needs
            </p>
            <Button 
              size="sm" 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={onAskAiClick}
              data-testid="button-ask-ai"
            >
              Ask AI for Help
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
