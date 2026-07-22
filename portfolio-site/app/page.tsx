const stack = [
  "React Native · Expo · TypeScript",
  "Spring Boot · Security · JPA",
  "PostgreSQL · Flyway",
  "Docker · k3s · Kustomize",
  "GitHub Actions · GHCR",
  "Prometheus · Grafana",
  "OpenAI API",
];

const features = [
  { no: "01", title: "시간을 계획으로", body: "월간·오늘 일정과 타임 블록을 연결해 해야 할 일을 실제 시간에 배치합니다." },
  { no: "02", title: "막막함을 다음 행동으로", body: "AI 작업 분해가 큰 목표를 시작 가능한 작은 단계와 예상 시간으로 바꿉니다." },
  { no: "03", title: "말하면 일정으로", body: "음성 명령을 구조화한 뒤 사용자가 제목과 시간을 확인하고 저장합니다." },
  { no: "04", title: "실행을 기록으로", body: "포커스 세션, 루틴, 목표, 하루 회고를 한 흐름으로 연결합니다." },
];

const evidence = [
  ["28", "Backend tests"],
  ["13", "Database tables"],
  ["7", "Flyway migrations"],
  ["24/7", "Home-lab operation"],
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="AntiADHD 홈"><span>A</span>ntiADHD</a>
        <div className="navLinks">
          <a href="#product">제품</a><a href="#architecture">아키텍처</a><a href="#operations">운영</a>
          <a className="navCta" href="https://github.com/heolyun/AntiADHD">GitHub ↗</a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><i /> PRIVATE BETA · ON-PREMISE</div>
        <h1>계획보다 어려운 건,<br/><em>시작하는 일</em>이니까.</h1>
        <p className="heroCopy">AntiADHD는 일정을 기록하는 데서 멈추지 않고,<br className="desktop"/> AI로 할 일을 쪼개고 시간에 배치해 실행까지 돕는 집중력 관리 플랫폼입니다.</p>
        <div className="heroActions">
          <a className="button primary" href="#architecture">시스템 살펴보기 <b>↓</b></a>
          <a className="button secondary" href="https://github.com/heolyun/AntiADHD">소스 코드 보기 ↗</a>
        </div>
        <div className="productFrame" aria-label="AntiADHD 제품 흐름 미리보기">
          <div className="frameBar"><span/><span/><span/><small>antiadhd · focus workspace</small></div>
          <div className="frameGrid">
            <div className="todayCard">
              <span className="label">TODAY · TUE</span><h2>오늘은 세 가지만.</h2>
              <div className="task done"><i>✓</i><div><b>아침 루틴</b><small>08:00 · 20분</small></div></div>
              <div className="task active"><i>2</i><div><b>포트폴리오 완성</b><small>10:00 · 포커스 50분</small></div><strong>집중 중</strong></div>
              <div className="task"><i>3</i><div><b>운동</b><small>19:00 · 60분</small></div></div>
            </div>
            <div className="aiCard"><span className="spark">✦</span><span className="label">AI NEXT ACTION</span><h3>“포트폴리오 준비”를<br/>지금 시작할 크기로</h3><ol><li>프로젝트 성과 3개 고르기 <small>10분</small></li><li>아키텍처 흐름 정리하기 <small>20분</small></li><li>운영 장애 사례 작성하기 <small>25분</small></li></ol><button>일정에 배치하기 →</button></div>
          </div>
        </div>
      </section>

      <section className="section shell" id="product">
        <header className="sectionHead"><span>01 · PRODUCT</span><h2>기능을 늘리는 대신,<br/>실행 흐름을 연결했습니다.</h2><p>입력 → 계획 → 집중 → 회고가 흩어지지 않도록 하나의 경험으로 설계했습니다.</p></header>
        <div className="featureGrid">{features.map((f) => <article key={f.no}><span>{f.no}</span><h3>{f.title}</h3><p>{f.body}</p></article>)}</div>
        <div className="stackList" aria-label="기술 스택">{stack.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className="archSection" id="architecture">
        <div className="shell">
          <header className="sectionHead light"><span>02 · ARCHITECTURE</span><h2>작은 서비스도<br/>운영 가능한 구조로.</h2><p>앱 실행 환경과 공개 포트폴리오를 분리하고, 홈 서버의 k3s 안에서 애플리케이션·데이터·관측 계층을 운영합니다.</p></header>
          <div className="architecture" role="img" aria-label="AntiADHD 시스템 아키텍처">
            <div className="archLane clients"><label>CLIENT</label><div className="node accent"><small>ANDROID</small><b>React Native App</b><span>일정 · 음성 · 포커스</span></div></div>
            <div className="arrow">→</div>
            <div className="archLane edge"><label>HOME NETWORK</label><div className="node"><small>ENTRY</small><b>Traefik Ingress</b><span>TLS · Routing</span></div></div>
            <div className="arrow">→</div>
            <div className="cluster">
              <label>K3S CLUSTER · UBUNTU</label>
              <div className="clusterGrid"><div className="node"><small>API</small><b>Spring Boot</b><span>JWT · REST · Actuator</span></div><div className="node"><small>ASYNC</small><b>AI Worker</b><span>Task breakdown</span></div><div className="node"><small>DATA</small><b>PostgreSQL</b><span>Flyway · PVC · Backup</span></div><div className="node"><small>OBSERVE</small><b>Prometheus + Grafana</b><span>Metrics · Dashboard</span></div></div>
            </div>
            <div className="external"><div className="line">↗ <span>OpenAI API</span></div><div className="line">↙ <span>GitHub Actions → GHCR</span></div></div>
          </div>
          <div className="archNotes"><p><b>왜 k3s인가?</b> 단일 홈 서버의 제한된 자원에서 Kubernetes의 Deployment, Service, Ingress, Secret, 관측 경험을 그대로 학습하기 위해 선택했습니다.</p><a href="https://github.com/heolyun/AntiADHD/blob/main/docs/architecture.md">상세 아키텍처 문서 ↗</a></div>
        </div>
      </section>

      <section className="section shell" id="operations">
        <header className="sectionHead"><span>03 · ENGINEERING</span><h2>배포보다 중요한 건,<br/>복구할 수 있다는 것.</h2></header>
        <div className="incident">
          <div><span className="incidentTag">INCIDENT CASE STUDY</span><h3>레거시 DB 마이그레이션 장애를<br/>데이터 손실 없이 복구했습니다.</h3><p>개발 환경과 운영 환경의 외래 키 이름 차이로 새 Pod가 CrashLoop에 진입했습니다. 즉시 이전 이미지로 롤백한 뒤, 운영 스키마 복제본에서 마이그레이션을 검증하고 제약 조건 이름이 아닌 관계를 기준으로 탐색하도록 수정했습니다.</p></div>
          <ol><li><b>01</b><span>Detect</span><small>Actuator·Pod 로그로 실패 지점 확인</small></li><li><b>02</b><span>Rollback</span><small>직전 GHCR 이미지로 서비스 복구</small></li><li><b>03</b><span>Verify</span><small>운영 스키마 기반 트랜잭션 dry-run</small></li><li><b>04</b><span>Redeploy</span><small>관계 기반 마이그레이션으로 재배포</small></li></ol>
        </div>
        <div className="evidence">{evidence.map(([n,l]) => <div key={l}><strong>{n}</strong><span>{l}</span></div>)}</div>
        <p className="truth">수치는 현재 저장소와 운영 환경 기준입니다. AntiADHD는 2인 사용을 위한 비공개 베타이며, 이 페이지는 시스템 설계와 구현 과정을 공개하는 포트폴리오입니다.</p>
      </section>

      <section className="cta"><div className="shell"><span>FROM IDEA TO OPERATION</span><h2>기능 구현에서 끝내지 않고,<br/>직접 운영해 배웠습니다.</h2><div><a className="button white" href="https://github.com/heolyun/AntiADHD">GitHub 저장소 ↗</a><a className="textLink" href="https://github.com/heolyun/AntiADHD/tree/main/docs">운영 문서 읽기 →</a></div></div></section>
      <footer className="footer shell"><a className="brand" href="#top"><span>A</span>ntiADHD</a><p>Designed, built and operated by <b>heolyun</b>.</p><small>© 2026 AntiADHD · Private beta</small></footer>
    </main>
  );
}
