import styles from "@/styles/home.module.css";

const features = [
  {
    title: "Hồ sơ sức khỏe tập trung",
    body: "Lưu trữ lịch sử khám, tiêm và dùng thuốc.",
  },
  {
    title: "Nhắc lịch thông minh",
    body: "Không bỏ lỡ lịch tiêm hay tái khám",
  },
  {
    title: "Theo dõi dễ dàng",
    body: "Cập nhật tình trạng sức khỏe theo thời gian",
  },
  {
    title: "Chia sẻ chăm sóc",
    body: "Kết nối với người chăm sóc một cách an toàn.",
  },
];

export function FeatureStrip() {
  return (
    <section className={styles.featureStrip} aria-label="Lợi ích của MMinCare">
      {features.map((feature, index) => (
        <article className={styles.feature} key={feature.title}>
          <h3>{feature.title}</h3>
          <p className={index === 0 ? styles.firstFeatureBody : undefined}>
            {feature.body}
          </p>
        </article>
      ))}
    </section>
  );
}
