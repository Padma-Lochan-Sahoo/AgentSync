"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ProfileForm } from "../components/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const ProfileView = () => {
  const trpc = useTRPC();

  const { data: profile } = useSuspenseQuery(trpc.profile.getOne.queryOptions());

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-6">
      <div className="pt-8 pb-4">
        <h1 className="text-4xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and view your usage analytics
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialValues={profile} />
        </CardContent>
      </Card>
    </div>
  );
};

export const ProfileViewLoading = () => (
  <div className="flex-1 pb-4 px-4 md:px-8">
    <LoadingState title="Loading profile..." description="Please wait" />
  </div>
);

export const ProfileViewError = () => (
  <div className="flex-1 pb-4 px-4 md:px-8">
    <ErrorState
      title="Failed to load profile"
      description="Please try again later"
    />
  </div>
);

