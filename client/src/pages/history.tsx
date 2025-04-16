import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, FileText, AlertCircle, Trash2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ResearchQuery {
  id: number;
  queryId: string;
  query: string;
  modelType: 'combined' | 'compound' | 'llama';
  status: string;
  title: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface ResearchHistoryResponse {
  queries: ResearchQuery[];
  pagination: PaginationData;
}

export default function History() {
  const [page, setPage] = useState(0);
  const [deleteQueryId, setDeleteQueryId] = useState<string | null>(null);
  const limit = 10;
  const offset = page * limit;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ResearchHistoryResponse>({
    queryKey: ['/api/research', { limit, offset }],
    queryFn: () => 
      fetch(`/api/research?limit=${limit}&offset=${offset}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch research history');
          return res.json();
        }),
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (queryId: string) => {
      const response = await fetch(`/api/research/${queryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete research');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/research'] });
      toast({
        title: "Research deleted",
        description: "The research has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete research",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getModelBadge = (modelType: string) => {
    switch (modelType) {
      case 'combined':
        return <Badge variant="outline" className="bg-purple-900 text-white">Combined</Badge>;
      case 'compound':
        return <Badge variant="outline" className="bg-amber-600 text-white">Compound</Badge>;
      case 'llama':
        return <Badge variant="outline" className="bg-blue-900 text-white">Llama 4</Badge>;
      default:
        return <Badge variant="outline">{modelType}</Badge>;
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  };

  const renderPagination = () => {
    if (!data?.pagination) return null;

    const totalPages = Math.ceil(data.pagination.total / limit);
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          {page > 0 && (
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage(p => Math.max(0, p - 1))} />
            </PaginationItem>
          )}
          
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNumber = i;
            
            // Adjust page numbers when current page is > 2
            if (page > 2) {
              pageNumber = page - 2 + i;
            }
            
            // Don't show page numbers beyond the total
            if (pageNumber >= totalPages) return null;
            
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink 
                  isActive={pageNumber === page}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber + 1}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {page < totalPages - 1 && (
            <PaginationItem>
              <PaginationNext onClick={() => setPage(p => p + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Research History</h1>
          <Link href="/">
            <Button variant="outline">New Research</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="w-full">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="w-full bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertCircle className="mr-2 h-5 w-5" />
                Error Loading Research History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">
                {error instanceof Error ? error.message : 'Failed to load research history'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4 border-red-300 text-red-600"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {data?.queries.length === 0 ? (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>No Research Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    You haven't conducted any research yet. Start your first research query to see results here.
                  </p>
                  <Link href="/">
                    <Button className="mt-4">Start Research</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {data?.queries.map((query) => (
                  <Card key={query.queryId} className="w-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>
                            {query.title || `Research: ${query.query.substring(0, 50)}${query.query.length > 50 ? '...' : ''}`}
                          </CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" /> 
                            {getTimeAgo(query.createdAt)}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          {getStatusBadge(query.status)}
                          {getModelBadge(query.modelType)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-gray-700">{query.query}</p>
                      <div className="flex justify-end space-x-2">
                        {query.status === 'completed' && (
                          <Link href={`/report/${query.queryId}`}>
                            <Button variant="default" size="sm" className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" /> View Report
                            </Button>
                          </Link>
                        )}
                        <Link href={`/research/${query.queryId}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Research</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this research? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => deleteMutation.mutate(query.queryId)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {renderPagination()}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}