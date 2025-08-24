import { useRouter } from "next/navigation";
import { ChevronDownIcon, CreditCardIcon, LogOutIcon, Loader2Icon} from "lucide-react";
import { useState } from "react";


import { authClient } from "@/lib/auth-client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { LoadingState } from "@/components/loading-state";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import{
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";




export const DashboardUserButton = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  const onLogout = async () => {
    setIsLoggingOut(true);
   
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Don't set loading to false here since we're redirecting
            router.push("/sign-in");
          },
          onError: () => {
            setIsLoggingOut(false);
          }
        }
      });
    } catch (error) {
      setIsLoggingOut(false);
    }
  }


  // Show inline loading state when logging out
  if (isLoggingOut) {
    return (
      <div className="rounded-lg border-border/10 p-3 w-full flex items-center justify-between bg-white/5 opacity-75">
        <div className="flex items-center gap-3">
          <Loader2Icon className="size-5 animate-spin text-primary" />
          <div className="flex flex-col gap-0.5 text-left">
            <p className="text-sm">Signing out...</p>
            <p className="text-xs text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    );
  }


  if (isPending || !data?.user) {
    return null;
  }


  if(isMobile){
    return (
      <Drawer>
        <DrawerTrigger
          className="rounded-lg border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2"
          disabled={isLoggingOut}
        >
          {data.user.image ? (
          <Avatar>
            <AvatarImage src={data.user.image} />
          </Avatar>
        ) : (
          <GeneratedAvatar
            seed={data.user.name}
            variant="initials"
            className="size-9 mr-3"
          />
        )}
        <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
          <p className="text-sm truncate w-full">{data.user.email}</p>
          <p className="text-xs truncate w-full">{data.user.name}</p>
        </div>
        <ChevronDownIcon className="size-4 shrink-0"/>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{data.user.name}</DrawerTitle>
            <DrawerDescription>{data.user.email}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button
              variant="outline"
              onClick={() => {}}
              disabled={isLoggingOut}
            >
              <CreditCardIcon className="size-4 text-black"/>
              Billing
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              <LogOutIcon className="size-4 text-black"/>
              {isLoggingOut ? "Signing out..." : "Logout"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
 
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-lg border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2"
        disabled={isLoggingOut}
      >
        {data.user.image ? (
          <Avatar>
            <AvatarImage src={data.user.image} />
          </Avatar>
        ) : (
          <GeneratedAvatar
            seed={data.user.name}
            variant="initials"
            className="size-9 mr-3"
          />
        )}
        <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
          <p className="text-sm truncate w-full">{data.user.email}</p>
          <p className="text-xs truncate w-full">{data.user.name}</p>
        </div>
        <ChevronDownIcon className="size-4 shrink-0"/>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-72">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium truncate">{data.user.name}</span>
            <span className="text-sm front-normal text-muted-foreground truncate">
              {data.user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <DropdownMenuItem
          className="cursor-pointer flex items-center justify-between"
          disabled={isLoggingOut}
        >
          Billing
          <CreditCardIcon className="size-4"/>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer flex items-center justify-between"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Signing out..." : "Logout"}
          <LogOutIcon className="size-4"/>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

