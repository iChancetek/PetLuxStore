import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sparkles, Save, Wand2, Upload, ImageIcon, X } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Product slug is required"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  originalPrice: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  inStock: z.number().min(0, "Stock must be 0 or greater"),
  petType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: any;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const csrfMatch = document.cookie.match(/pot_csrf=([^;]+)/);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';

      const response = await fetch("/api/admin/uploads/image", {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      form.setValue("imageUrl", data.imageUrl);
      setImagePreview(data.imageUrl);
      toast({
        title: "Image uploaded",
        description: "Product image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    form.setValue("imageUrl", "");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      shortDescription: product?.shortDescription || "",
      price: product?.price || "",
      originalPrice: product?.originalPrice || "",
      categoryId: product?.categoryId || "",
      brand: product?.brand || "",
      imageUrl: product?.imageUrl || "",
      inStock: product?.inStock || 0,
      petType: product?.petType || "",
      tags: product?.tags || [],
      isActive: product?.isActive !== false,
    },
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ["/api/categories"],
  });

  // Create/Update product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const method = product ? "PATCH" : "POST";
      
      const payload = {
        ...data,
        price: parseFloat(data.price),
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
      };
      
      await apiRequest(method, url, payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Product ${product ? "updated" : "created"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${product ? "update" : "create"} product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Generate AI description mutation
  const generateAIMutation = useMutation({
    mutationFn: async () => {
      if (!product?.id) {
        throw new Error("Product must be saved before generating AI description");
      }
      
      const response = await apiRequest("POST", `/api/products/${product.id}/generate-description`, {
        keyFeatures: form.getValues("tags") || [],
        targetPet: form.getValues("petType") || "pets",
        regenerate: true,
      });
      return response.json();
    },
    onSuccess: (data) => {
      form.setValue("description", data.aiDescription.longDescription);
      form.setValue("shortDescription", data.aiDescription.shortDescription);
      toast({
        title: "AI Description Generated",
        description: "Product description has been generated using AI.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "AI Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    saveProductMutation.mutate(data);
  };

  const handleGenerateAI = () => {
    setIsGeneratingAI(true);
    generateAIMutation.mutate();
    setTimeout(() => setIsGeneratingAI(false), 2000);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.getValues("tags")?.includes(tagInput.trim())) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!product) {
      form.setValue("slug", generateSlugFromName(name));
    }
  };

  const petTypes = [
    { value: "dog", label: "Dogs" },
    { value: "cat", label: "Cats" },
    { value: "bird", label: "Birds" },
    { value: "fish", label: "Fish" },
    { value: "small-animal", label: "Small Animals" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" data-testid="text-basic-info">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      handleNameChange(e.target.value);
                    }}
                    data-testid="input-product-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Slug *</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-product-slug" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      data-testid="input-product-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="originalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Price</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      data-testid="input-product-original-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="inStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="0"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-product-stock"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Categorization */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" data-testid="text-categorization">Categorization</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="petType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-pet-type">
                        <SelectValue placeholder="Select pet type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {petTypes.map((pet) => (
                        <SelectItem key={pet.value} value={pet.value}>
                          {pet.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Royal Canin" data-testid="input-product-brand" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Product Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" data-testid="text-product-details">Product Details</h3>
            {product && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI || generateAIMutation.isPending}
                data-testid="button-generate-ai"
              >
                {isGeneratingAI || generateAIMutation.isPending ? (
                  <>
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3 mr-2" />
                    Generate AI Description
                  </>
                )}
              </Button>
            )}
          </div>

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={2}
                    placeholder="Brief product summary..."
                    data-testid="textarea-short-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={6}
                    placeholder="Detailed product description..."
                    data-testid="textarea-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Image Upload */}
          <div className="space-y-3">
            <Label>Product Image</Label>
            
            {/* Image Preview */}
            {(imagePreview || form.watch("imageUrl")) && (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
                <img
                  src={imagePreview || form.watch("imageUrl") || ""}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=128&h=128&fit=crop";
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                data-testid="button-upload-image"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">or enter URL below</span>
            </div>

            {/* URL Input Fallback */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      onChange={(e) => {
                        field.onChange(e);
                        setImagePreview(e.target.value || null);
                      }}
                      data-testid="input-image-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" data-testid="text-tags">Product Tags</h3>
          
          <div className="flex space-x-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              data-testid="input-tag"
            />
            <Button type="button" variant="outline" onClick={handleAddTag} data-testid="button-add-tag">
              Add Tag
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.watch("tags")?.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => handleRemoveTag(tag)}
                data-testid={`badge-tag-${index}`}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" data-testid="text-status">Status</h3>
          
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-is-active"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Active Product
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Product will be visible to customers when active
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saveProductMutation.isPending}
            data-testid="button-save-product"
          >
            {saveProductMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {product ? "Update Product" : "Create Product"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
