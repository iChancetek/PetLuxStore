import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Activity as ActivityIcon,
  Settings,
  Filter,
  Clock
} from "lucide-react";

interface ActivityTimelineProps {
  className?: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'page_view':
      return Eye;
    case 'product_view':
      return Package;
    case 'add_to_cart':
      return ShoppingCart;
    case 'checkout_started':
    case 'purchase_completed':
      return CreditCard;
    case 'admin_ui':
      return Settings;
    default:
      return ActivityIcon;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'page_view':
      return 'bg-gray-100 text-gray-800';
    case 'product_view':
      return 'bg-blue-100 text-blue-800';
    case 'add_to_cart':
      return 'bg-orange-100 text-orange-800';
    case 'checkout_started':
      return 'bg-purple-100 text-purple-800';
    case 'purchase_completed':
      return 'bg-green-100 text-green-800';
    case 'admin_ui':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatActivityTitle = (type: string, metadata?: any) => {
  switch (type) {
    case 'page_view':
      return `Visited ${metadata?.page || 'a page'}`;
    case 'product_view':
      return `Viewed ${metadata?.productName || 'a product'}`;
    case 'add_to_cart':
      return `Added ${metadata?.productName || 'item'} to cart`;
    case 'checkout_started':
      return 'Started checkout process';
    case 'purchase_completed':
      return `Completed purchase of ${metadata?.itemCount || '1'} item(s)`;
    case 'admin_ui':
      return 'Accessed admin interface';
    default:
      return 'Performed an action';
  }
};

const formatActivityDescription = (type: string, metadata?: any) => {
  switch (type) {
    case 'page_view':
      return metadata?.url ? `Page: ${metadata.url}` : '';
    case 'product_view':
      return metadata?.productId ? `Product ID: ${metadata.productId}` : '';
    case 'add_to_cart':
      return metadata?.quantity ? `Quantity: ${metadata.quantity}` : '';
    case 'checkout_started':
      return metadata?.cartTotal ? `Cart total: $${metadata.cartTotal}` : '';
    case 'purchase_completed':
      return metadata?.orderTotal ? `Order total: $${metadata.orderTotal}` : '';
    case 'admin_ui':
      return metadata?.section ? `Section: ${metadata.section}` : '';
    default:
      return '';
  }
};

export default function ActivityTimeline({ className = "" }: ActivityTimelineProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [activityType, setActivityType] = useState<string>('');
  const itemsPerPage = 20;

  const { data: activitiesData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/me/activity", { page: currentPage, limit: itemsPerPage, ...(activityType && { type: activityType }) }],
  });

  const totalPages = activitiesData ? Math.ceil(activitiesData.total / itemsPerPage) : 1;

  const activityTypes = [
    { value: '', label: 'All Activities' },
    { value: 'page_view', label: 'Page Views' },
    { value: 'product_view', label: 'Product Views' },
    { value: 'add_to_cart', label: 'Cart Additions' },
    { value: 'checkout_started', label: 'Checkout Started' },
    { value: 'purchase_completed', label: 'Purchases' },
    { value: 'admin_ui', label: 'Admin Access' },
  ];

  const handleFilterChange = (value: string) => {
    setActivityType(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Failed to load activity timeline</p>
            <Button onClick={() => refetch()} data-testid="button-retry-activity">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activitiesData?.data || activitiesData.data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity Timeline</CardTitle>
          <Select value={activityType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-48" data-testid="select-activity-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter activities" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2" data-testid="text-no-activity-title">
              {activityType ? 'No activities found' : 'No activity yet'}
            </h3>
            <p className="text-muted-foreground" data-testid="text-no-activity-description">
              {activityType 
                ? `No ${activityTypes.find(t => t.value === activityType)?.label.toLowerCase()} activities found`
                : 'Start browsing and shopping to see your activity here'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Activity Timeline</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {activitiesData.total} total activities
            {activitiesData.filter?.type && ` • Filtered by ${activityTypes.find(t => t.value === activitiesData.filter.type)?.label}`}
          </p>
        </div>
        <Select value={activityType} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-48" data-testid="select-activity-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter activities" />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activitiesData.data.map((activity: any, index: number) => {
            const IconComponent = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start space-x-4" data-testid={`activity-item-${index}`}>
                <div className={`p-2 rounded-full ${getActivityColor(activity.type).split(' ')[0]} flex-shrink-0`}>
                  <IconComponent className={`h-4 w-4 ${getActivityColor(activity.type).split(' ').slice(1).join(' ')}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" data-testid={`activity-title-${index}`}>
                      {formatActivityTitle(activity.type, activity.metadata)}
                    </p>
                    <Badge className={getActivityColor(activity.type)} data-testid={`activity-badge-${index}`}>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  {formatActivityDescription(activity.type, activity.metadata) && (
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`activity-description-${index}`}>
                      {formatActivityDescription(activity.type, activity.metadata)}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground" data-testid={`activity-time-${index}`}>
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 pt-6 mt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                data-testid="button-activity-prev-page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-activity-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}