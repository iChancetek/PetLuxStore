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
  Shield, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Calendar,
  User,
  Activity,
  Download,
  Filter,
  Eye,
  RefreshCw
} from "lucide-react";

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: any;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export default function AuditLogsTab() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 50;

  // Fetch audit logs with filters
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/audit-logs", { 
      userId: search, 
      action: actionFilter,
      resourceType: resourceTypeFilter,
      dateFrom,
      dateTo,
      page, 
      limit 
    }],
    enabled: true,
  });

  const logs = (logsData as any)?.logs || [];
  const total = (logsData as any)?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, resourceTypeFilter, dateFrom, dateTo]);

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const handleExportLogs = () => {
    const exportData = {
      logs: logs,
      filters: {
        search,
        actionFilter,
        resourceTypeFilter,
        dateFrom,
        dateTo
      },
      pagination: {
        page,
        limit,
        total
      },
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "secondary";
    if (action.includes("update") || action.includes("edit")) return "outline";
    if (action.includes("delete")) return "destructive";
    if (action.includes("view") || action.includes("list")) return "default";
    return "outline";
  };

  const getResourceTypeColor = (resourceType: string) => {
    switch (resourceType) {
      case "user": return "bg-blue-100 text-blue-800";
      case "product": return "bg-green-100 text-green-800";
      case "order": return "bg-purple-100 text-purple-800";
      case "analytics": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent || userAgent === 'unknown') return 'Unknown';
    
    // Extract browser and OS info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
    const osMatch = userAgent.match(/(Windows|Macintosh|Linux|Android|iOS)/);
    
    const browser = browserMatch ? browserMatch[1] : 'Unknown Browser';
    const os = osMatch ? osMatch[1] : 'Unknown OS';
    
    return `${browser} on ${os}`;
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("");
    setResourceTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-audit-title">
            Audit Logs
          </h2>
          <p className="text-muted-foreground" data-testid="text-audit-subtitle">
            Monitor admin actions and system events for compliance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh-logs"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            data-testid="button-export-logs"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Audit Logs ({total})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-logs"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger data-testid="select-action-filter">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                <SelectItem value="create">Create Actions</SelectItem>
                <SelectItem value="update">Update Actions</SelectItem>
                <SelectItem value="delete">Delete Actions</SelectItem>
                <SelectItem value="view">View Actions</SelectItem>
                <SelectItem value="login">Login Actions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
              <SelectTrigger data-testid="select-resource-filter">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Resources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              data-testid="input-audit-date-from"
            />
            <Input
              type="date"
              placeholder="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              data-testid="input-audit-date-to"
            />
          </div>

          {/* Audit Logs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: AuditLog) => (
                    <>
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLogExpansion(log.id)}
                            data-testid={`button-expand-log-${log.id}`}
                          >
                            {expandedLogs.has(log.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium" data-testid={`text-log-date-${log.id}`}>
                              {new Date(log.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-muted-foreground flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getActionColor(log.action)}
                            data-testid={`badge-action-${log.id}`}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge 
                              className={getResourceTypeColor(log.resourceType)}
                              data-testid={`badge-resource-${log.id}`}
                            >
                              {log.resourceType}
                            </Badge>
                            {log.resourceId && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ID: {log.resourceId.slice(-8)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              <span className="font-medium" data-testid={`text-actor-${log.id}`}>
                                {log.actorId.slice(-8)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            <div>IP: {log.ip}</div>
                            <div className="text-xs">
                              {formatUserAgent(log.userAgent)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-view-log-${log.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Audit Log Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Basic Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Log ID:</strong> {log.id}</div>
                                      <div><strong>Timestamp:</strong> {new Date(log.createdAt).toLocaleString()}</div>
                                      <div><strong>Action:</strong> {log.action}</div>
                                      <div><strong>Resource Type:</strong> {log.resourceType}</div>
                                      <div><strong>Resource ID:</strong> {log.resourceId || "N/A"}</div>
                                      <div><strong>Actor ID:</strong> {log.actorId}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Connection Details</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>IP Address:</strong> {log.ip}</div>
                                      <div><strong>User Agent:</strong> {formatUserAgent(log.userAgent)}</div>
                                      <div className="text-xs text-muted-foreground break-all">
                                        {log.userAgent}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {log.metadata && (
                                  <div>
                                    <h4 className="font-medium mb-2">Metadata</h4>
                                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Log Details */}
                      {expandedLogs.has(log.id) && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="px-6 py-4 bg-muted/20 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2 text-sm">Full Details</h4>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <div><strong>Full Action:</strong> {log.action}</div>
                                    <div><strong>Resource:</strong> {log.resourceType}</div>
                                    {log.resourceId && <div><strong>Resource ID:</strong> {log.resourceId}</div>}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2 text-sm">Actor Information</h4>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <div><strong>Actor ID:</strong> {log.actorId}</div>
                                    <div><strong>IP Address:</strong> {log.ip}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2 text-sm">System Information</h4>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <div><strong>Browser:</strong> {formatUserAgent(log.userAgent)}</div>
                                    <div><strong>Timestamp:</strong> {new Date(log.createdAt).toISOString()}</div>
                                  </div>
                                </div>
                              </div>
                              {log.metadata && (
                                <div className="mt-4">
                                  <h4 className="font-medium mb-2 text-sm">Metadata</h4>
                                  <pre className="bg-background p-2 rounded text-xs overflow-auto max-h-32">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
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
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} logs
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