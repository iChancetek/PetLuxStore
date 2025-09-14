import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ShoppingCart, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Calendar,
  User,
  Package,
  DollarSign,
  MapPin,
  Eye,
  Filter
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: any;
  billingAddress: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  itemCount: number;
}

interface OrderDetails extends Order {
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      imageUrl: string;
      slug: string;
    };
  }>;
}

export default function OrdersTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 20;

  // Fetch orders with filters
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["/api/admin/orders", { 
      status: statusFilter, 
      userId: search, 
      dateFrom,
      dateTo,
      page, 
      limit 
    }],
    enabled: true,
  });

  // Fetch detailed order information
  const { data: orderDetails } = useQuery({
    queryKey: ["/api/admin/orders", selectedOrder],
    enabled: !!selectedOrder,
  });

  const orders = (ordersData as any)?.orders || [];
  const total = (ordersData as any)?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFrom, dateTo]);

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "secondary";
      case "shipped":
        return "outline";
      case "processing":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return "No address provided";
    return `${address.street || ""} ${address.city || ""} ${address.state || ""} ${address.zipCode || ""}`.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-orders-title">
            Order Management
          </h2>
          <p className="text-muted-foreground" data-testid="text-orders-subtitle">
            View and manage customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Orders ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by customer email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              data-testid="input-date-from"
            />
            <Input
              type="date"
              placeholder="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              data-testid="input-date-to"
            />
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: Order) => (
                    <>
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOrderExpansion(order.id)}
                            data-testid={`button-expand-order-${order.id}`}
                          >
                            {expandedOrders.has(order.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`text-order-number-${order.id}`}>
                              {order.orderNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              #{order.id.slice(-8)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`text-customer-name-${order.id}`}>
                              {order.user.firstName} {order.user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {order.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Package className="w-3 h-3 mr-1" />
                            {order.itemCount} items
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium" data-testid={`text-order-total-${order.id}`}>
                            ${Number(order.total).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            +${Number(order.tax).toFixed(2)} tax
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusColor(order.status)}
                            data-testid={`badge-order-status-${order.id}`}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order.id)}
                                data-testid={`button-view-order-${order.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
                              </DialogHeader>
                              {orderDetails && (
                                <div className="space-y-6">
                                  {/* Order Info */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base">Customer Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex items-center">
                                          <User className="w-4 h-4 mr-2" />
                                          <span>{orderDetails.user.firstName} {orderDetails.user.lastName}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {orderDetails.user.email}
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base">Order Summary</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                          <span>Subtotal:</span>
                                          <span>${Number(orderDetails.subtotal).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Tax:</span>
                                          <span>${Number(orderDetails.tax).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Shipping:</span>
                                          <span>${Number(orderDetails.shipping).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t pt-2">
                                          <span>Total:</span>
                                          <span>${Number(orderDetails.total).toFixed(2)}</span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Addresses */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base flex items-center">
                                          <MapPin className="w-4 h-4 mr-2" />
                                          Shipping Address
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-sm">
                                          {formatAddress(orderDetails.shippingAddress)}
                                        </p>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base flex items-center">
                                          <DollarSign className="w-4 h-4 mr-2" />
                                          Billing Address
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-sm">
                                          {formatAddress(orderDetails.billingAddress)}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Order Items */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Order Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        {orderDetails.orderItems?.map((item) => (
                                          <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                                            <img
                                              src={item.product.imageUrl || "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=50"}
                                              alt={item.product.name}
                                              className="w-12 h-12 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium">{item.product.name}</div>
                                              <div className="text-sm text-muted-foreground">
                                                Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
                                              </div>
                                            </div>
                                            <div className="font-medium">
                                              ${(Number(item.price) * item.quantity).toFixed(2)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Order Details */}
                      {expandedOrders.has(order.id) && (
                        <TableRow>
                          <TableCell colSpan={8} className="p-0">
                            <div className="px-6 py-4 bg-muted/20 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Customer Details</h4>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <div>Email: {order.user.email}</div>
                                    <div>Customer ID: {order.userId}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Order Summary</h4>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <div>Subtotal: ${Number(order.subtotal).toFixed(2)}</div>
                                    <div>Tax: ${Number(order.tax).toFixed(2)}</div>
                                    <div>Shipping: ${Number(order.shipping).toFixed(2)}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Addresses</h4>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <div>
                                      <strong>Ship to:</strong> {formatAddress(order.shippingAddress)}
                                    </div>
                                    <div>
                                      <strong>Bill to:</strong> {formatAddress(order.billingAddress)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  data-testid="button-previous-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="text-sm">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}