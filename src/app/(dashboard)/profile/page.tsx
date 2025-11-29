import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";

import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";

import {
  ProfileView,
  ProfileViewError,
  ProfileViewLoading,
} from "@/modules/profile/ui/views/profile-view";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

const Page = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    
    if (!session) {
        redirect("/sign-in");
    }

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(trpc.profile.getOne.queryOptions());

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<ProfileViewLoading />}>
                <ErrorBoundary fallback={<ProfileViewError />}>
                    <ProfileView />
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
    );
};

export default Page;

