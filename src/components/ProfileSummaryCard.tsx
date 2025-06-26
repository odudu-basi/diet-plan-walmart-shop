
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface Profile {
  goal?: string;
  activity_level?: string;
  age?: number;
  weight?: number;
  dietary_restrictions?: string[];
}

interface ProfileSummaryCardProps {
  profile: Profile;
}

const ProfileSummaryCard = ({ profile }: ProfileSummaryCardProps) => {
  return (
    <Card className="shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-green-600" />
          <span>Your Profile Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-600">Goal</p>
            <p className="capitalize">{profile?.goal?.replace('-', ' ') || 'Not set'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Activity Level</p>
            <p className="capitalize">{profile?.activity_level || 'Not set'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Age</p>
            <p>{profile?.age ? `${profile.age} years` : 'Not set'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Weight</p>
            <p>{profile?.weight ? `${profile.weight} lbs` : 'Not set'}</p>
          </div>
        </div>
        {profile?.dietary_restrictions && profile.dietary_restrictions.length > 0 && (
          <div className="mt-4">
            <p className="font-medium text-gray-600 mb-2">Dietary Preferences</p>
            <div className="flex flex-wrap gap-2">
              {profile.dietary_restrictions.map((restriction, index) => (
                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {restriction}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSummaryCard;
