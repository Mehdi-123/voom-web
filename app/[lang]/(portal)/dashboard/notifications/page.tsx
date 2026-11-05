import NoticesList from "@/components/portal/NoticesList";

// Depends on who is signed in, which only the browser knows: no instant-navigation check
export const instant = false;

export default function Page() {
  return <NoticesList />;
}
