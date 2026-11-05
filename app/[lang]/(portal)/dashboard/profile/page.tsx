import ProfileRoute from "@/components/portal/ProfileRoute";

// Depends on who is signed in, which only the browser knows: no instant-navigation check
export const instant = false;

export default function Page() {
  return <ProfileRoute />;
}
