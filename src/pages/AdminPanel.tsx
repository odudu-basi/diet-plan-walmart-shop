
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newFeature, setNewFeature] = useState({ name: '', description: '' });

  // For demo purposes - in production, implement proper admin role checking
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('owner');

  const { data: featureFlags } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast({ title: "Feature flag updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating feature flag", variant: "destructive" });
      console.error(error);
    },
  });

  const addFeatureMutation = useMutation({
    mutationFn: async (feature: { name: string; description: string }) => {
      const { error } = await supabase
        .from('feature_flags')
        .insert([{
          name: feature.name,
          description: feature.description,
          enabled: false,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setNewFeature({ name: '', description: '' });
      toast({ title: "Feature flag created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating feature flag", variant: "destructive" });
      console.error(error);
    },
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">Access denied. Admin privileges required.</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Add New Feature Flag */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Feature Flag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="feature-name">Feature Name</Label>
                <Input
                  id="feature-name"
                  value={newFeature.name}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., new-meal-planner"
                />
              </div>
              <div>
                <Label htmlFor="feature-description">Description</Label>
                <Input
                  id="feature-description"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description of the feature"
                />
              </div>
            </div>
            <Button 
              onClick={() => addFeatureMutation.mutate(newFeature)}
              disabled={!newFeature.name || addFeatureMutation.isPending}
            >
              {addFeatureMutation.isPending ? 'Adding...' : 'Add Feature Flag'}
            </Button>
          </CardContent>
        </Card>

        {/* Feature Flags List */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureFlags?.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{flag.name}</h3>
                    {flag.description && (
                      <p className="text-sm text-gray-600">{flag.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Updated: {new Date(flag.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(enabled) => 
                      toggleFeatureMutation.mutate({ id: flag.id, enabled })
                    }
                    disabled={toggleFeatureMutation.isPending}
                  />
                </div>
              ))}
              {featureFlags?.length === 0 && (
                <p className="text-gray-500 text-center py-8">No feature flags created yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
