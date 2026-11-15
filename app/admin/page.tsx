import { isAdmin } from "@/lib/auth";
import { rows } from "@/lib/db";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";
export const dynamic = "force-dynamic";
export default async function Admin() {
  if (!(await isAdmin())) return <Login />;
  return <Dashboard responses={rows().map(({ token, ...r }) => r)} />;
}
