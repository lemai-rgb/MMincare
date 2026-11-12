"use client";

import Link from "next/link";

import { MMinCareBrand } from "@/components/brand/MMinCareBrand";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { HomeDecorations } from "@/components/home/HomeDecorations";
import { SpeciesSelector } from "@/components/home/SpeciesSelector";
import styles from "@/styles/home.module.css";

export function HomeContent({ demoEnter }: { demoEnter?: () => void }) {
  return (
    <main className={styles.page}>
      <div className={styles.headerBackdrop} aria-hidden="true" />

      <section className={styles.shell} aria-labelledby="home-heading">
        <header className={styles.header}>
          <MMinCareBrand />

          <div className={styles.loginArea}>
            <span>Đã có tài khoản?</span>
            <Link className={styles.loginButton} href={demoEnter ? "/demo?screen=%2Fdashboard" : "/login"} onClick={demoEnter ? (event) => { event.preventDefault(); demoEnter(); } : undefined}>
              Đăng nhập
            </Link>
          </div>
        </header>

        <HomeDecorations />

        <div className={styles.hero}>
          <h1 id="home-heading" className={styles.srOnly}>
            MMinCare — chăm sóc thú cưng dễ dàng hơn
          </h1>
          <p className={styles.description}>
            MMinCare giúp bạn lưu trữ hồ sơ sức khỏe, nhắc lịch tiêm và theo dõi
            tình trạng của thú cưng tại một nơi.
          </p>
        </div>

        <section className={styles.getStarted} aria-labelledby="get-started-title">
          <h2 id="get-started-title">Bắt đầu dùng MMinCare</h2>
          <p>Chọn loại thú cưng của bạn để tạo hồ sơ đầu tiên</p>
        </section>

        <SpeciesSelector demoEnter={demoEnter} />

        <p className={styles.helperPill}>Hiện tại chỉ hỗ trợ chó mèo</p>

        <FeatureStrip />
      </section>
    </main>
  );
}
