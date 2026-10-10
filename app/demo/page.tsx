import type { Metadata } from "next";
import { PortfolioDemo } from "@/components/demo/PortfolioDemo";

export const metadata: Metadata = {
  title: "MMinCare — Live Demo",
  description: "Trải nghiệm hồ sơ thú cưng, nhật ký sức khỏe và nhắc hẹn với dữ liệu mẫu, không cần đăng ký.",
};

export default function DemoPage() {
  return <PortfolioDemo />;
}
