import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Order, OrderItem, Product } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Package, MapPin, CreditCard, Calendar, Truck } from "lucide-react";

interface OrderDetailDialogProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'processing':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'shipped':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
    case 'refunded':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function OrderDetailDialog({ orderId, isOpen, onClose }: OrderDetailDialogProps) {
  const { data: order, isLoading, error } = useQuery<Order & {
    items: (OrderItem & { product: Product })[];
  }>({
    queryKey: [`/api/me/orders/${orderId}`],
    enabled: !!orderId && isOpen,
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="dialog-order-detail">
        <DialogHeader>
          <DialogTitle>
            {orderId ? `Order #${orderId.slice(-8).toUpperCase()}` : 'Order Details'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-32" />
              <Skeleton className="h-24" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-order-error">
                Failed to load order details
              </p>
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Date</p>
                        <p className="text-lg" data-testid="text-order-date">
                          {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Total</p>
                        <p className="text-lg font-bold" data-testid="text-order-total">
                          ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status and Tracking */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Truck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Status</p>
                        <Badge className={getStatusColor(order.status)} data-testid="badge-order-status">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    {order.trackingNumber && (
                      <div className="text-right">
                        <p className="text-sm font-medium">Tracking Number</p>
                        <p className="text-sm font-mono" data-testid="text-tracking-number">
                          {order.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <MapPin className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Shipping Address</p>
                        <div className="text-sm text-muted-foreground" data-testid="text-shipping-address">
                          <p>{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.line1}</p>
                          {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                          <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                          </p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <Package className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order Items</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items?.map((item: any, index: number) => (
                      <div key={item.id || index} className="flex items-center space-x-4 p-3 border rounded-lg" data-testid={`order-item-${index}`}>
                        {item.product?.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium" data-testid={`item-name-${index}`}>
                            {item.product?.name || item.productName || 'Product'}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground" data-testid={`item-quantity-${index}`}>
                              Quantity: {item.quantity}
                            </p>
                            <p className="font-medium" data-testid={`item-price-${index}`}>
                              ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">No items found</p>
                    )}
                  </div>

                  {/* Order Total Breakdown */}
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span data-testid="text-subtotal">
                        ${(order.subtotal || order.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {order.shippingCost && order.shippingCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span data-testid="text-shipping-cost">
                          ${order.shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {order.tax && order.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span data-testid="text-tax">
                          ${order.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span data-testid="text-final-total">
                        ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-order-not-found">
                Order not found
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}