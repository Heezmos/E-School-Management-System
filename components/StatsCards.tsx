export default function StatsCards({ stats }: { stats: [string, string | number][] }) {
  return (
    <section className="cards">
      {stats.map(([label, value]) => (
        <article className="card" key={label}>
          <div className="label">{label}</div>
          <div className="value">{value}</div>
        </article>
      ))}
    </section>
  );
}
