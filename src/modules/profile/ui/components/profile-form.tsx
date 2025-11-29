"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import Image from "next/image";
import { User } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingButton } from "@/components/loading-button";
import { profileUpdateSchema } from "../../schemas";
import { ProfileGetOne } from "../../types";
import { isValidUrl } from "@/lib/url-utils";

interface ProfileFormProps {
  initialValues: ProfileGetOne;
}

export const ProfileForm = ({ initialValues }: ProfileFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: initialValues.name,
      email: initialValues.email,
      image: initialValues.image || "",
    },
  });

  const updateProfile = useMutation(
    trpc.profile.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.profile.getOne.queryOptions());
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const onSubmit = (values: z.infer<typeof profileUpdateSchema>) => {
    updateProfile.mutate(values);
  };

  const userImage = form.watch("image");
  const displayImage = userImage && isValidUrl(userImage) ? userImage : null;

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={form.watch("name") || "User"}
                width={96}
                height={96}
                className="rounded-full border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center border-2 border-border">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              Profile Picture
            </p>
            <p className="text-xs text-muted-foreground">
              Enter a valid image URL to update your profile picture
            </p>
          </div>
        </div>

        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="your@email.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="image"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Image URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="url"
                  placeholder="https://example.com/image.jpg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <LoadingButton
            type="submit"
            isLoading={updateProfile.isPending}
            disabled={!form.formState.isDirty}
          >
            Save Changes
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
};

