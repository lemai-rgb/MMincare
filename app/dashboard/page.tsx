import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { parseSpecies } from "@/lib/authRedirect";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/dashboard.module.css";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ species?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/login");

  const params = await searchParams;
  const requestedSpecies = Array.isArray(params.species) ? params.species[0] : params.species;
  const species = parseSpecies(requestedSpecies);

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="dashboard-title">
        <div>
          <p className={styles.brand}>MMinCare</p>
          <h1 id="dashboard-title">Xin chào!</h1>
          <p>Bạn đã đăng nhập thành công. Dashboard quản lý thú cưng đang được hoàn thiện.</p>
          {species && (
            <p className={styles.onboardingNote}>
              Lựa chọn {species === "cat" ? "Mèo" : "Chó"} của bạn đã được giữ lại cho bước tạo hồ sơ.
            </p>
          )}
        </div>
        <LogoutButton />
      </section>
    </main>
  );
}
